import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { unlink } from 'node:fs/promises';
import express = require('express');
import request = require('supertest');
import { AppModule } from '../src/app.module';

const pages = ['/', '/archive/', '/series/java-spring/', '/api-comparison/'];

function meta(html: string, attribute: string, value: string): string {
  const pattern = new RegExp(`<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${value}["']`, 'i');
  const match = html.match(pattern);
  return match?.[1] ?? match?.[2] ?? '';
}

function assertPageStructure(html: string) {
  expect(html).toMatch(/<html[^>]+lang=["']vi["']/i);
  expect((html.match(/<h1\b/gi) ?? []).length).toBe(1);
  expect(html).toMatch(/<title>[^<]+<\/title>/i);
  expect(html).toMatch(/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+/i);
  expect(html).toMatch(/<link[^>]+rel=["']canonical["'][^>]+href=["']https?:\/\//i);
  for (const property of ['og:type', 'og:locale', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt']) {
    expect(meta(html, 'property', property)).toBeTruthy();
  }
  for (const name of ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
    expect(meta(html, 'name', name)).toBeTruthy();
  }
  expect(meta(html, 'property', 'og:image')).toMatch(/^https?:\/\//);
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(ids.length);
  for (const match of html.matchAll(/href=["']#([^"']+)["']/gi)) {
    expect(ids).toContain(match[1]);
  }
  const jsonLd = [...html.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)];
  expect(jsonLd.length).toBeGreaterThan(0);
  for (const block of jsonLd) expect(() => JSON.parse(block[1])).not.toThrow();
}

describe('public blog regression', () => {
  let app: INestApplication;
  const databasePath = join(tmpdir(), `quang-tam-blog-test-${process.pid}.sqlite`);
  beforeAll(async () => {
    process.env.DATABASE_PATH = databasePath;
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.getHttpAdapter().getInstance().use('/assets', express.static(join(process.cwd(), 'public', 'assets')));
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await Promise.all([unlink(databasePath).catch(() => undefined), unlink(`${databasePath}-wal`).catch(() => undefined), unlink(`${databasePath}-shm`).catch(() => undefined)]);
    delete process.env.DATABASE_PATH;
  });
  it('serves a stable health payload', async () => {
    await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok', service: 'quang-tam-blog' });
  });
  it('reads and increments views for real posts only', async () => {
    await request(app.getHttpServer()).get('/api/posts/api-comparison/views').expect(200).expect({ slug: 'api-comparison', views: 0 });
    await request(app.getHttpServer()).post('/api/posts/api-comparison/view').expect(200).expect({ slug: 'api-comparison', views: 1 });
    await request(app.getHttpServer()).post('/api/posts/api-comparison/view').expect(200).expect({ slug: 'api-comparison', views: 2 });
    await request(app.getHttpServer()).get('/api/posts/api-comparison/views').expect(200).expect({ slug: 'api-comparison', views: 2 });
    await request(app.getHttpServer()).get('/api/posts/not-a-post/views').expect(404);
    await request(app.getHttpServer()).post('/api/posts/INVALID_slug/view').expect(404);
  });
  it.each(pages)('serves and validates %s', async (path) => {
    const response = await request(app.getHttpServer()).get(path).expect(200);
    assertPageStructure(response.text);
    if (path === '/api-comparison/') expect(response.text).toContain('data-post-slug="api-comparison"');
  });
  it('serves core static assets and SEO endpoints', async () => {
    await request(app.getHttpServer()).get('/assets/styles.css').expect(200);
    const script = await request(app.getHttpServer()).get('/assets/script.js').expect(200);
    expect(script.text).toContain('Intl.NumberFormat("vi-VN")');
    await request(app.getHttpServer()).get('/assets/img/preview-api.webp').expect(200).expect('Content-Type', /image\/webp/);
    await request(app.getHttpServer()).get('/robots.txt').expect(200).expect('Content-Type', /text\/plain/);
    const sitemap = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);
    expect(sitemap.text).toContain('/series/java-spring/');
    expect(sitemap.text).not.toContain('/health');
  });
  it('redirects the legacy article slug permanently', async () => {
    await request(app.getHttpServer())
      .get('/api-comparation/')
      .expect(301)
      .expect('Location', '/api-comparison/');
  });
  it('returns 404 for an unknown route', async () => {
    await request(app.getHttpServer()).get('/khong-ton-tai/').expect(404);
  });
});
