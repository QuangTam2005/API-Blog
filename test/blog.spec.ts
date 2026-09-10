import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { join } from 'node:path';
import express = require('express');
import request = require('supertest');
import { AppModule } from '../src/app.module';

const pages = ['/', '/archive/', '/series/java-spring/', '/api-comparation/'];

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
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.getHttpAdapter().getInstance().use(express.static(join(process.cwd(), 'public')));
    await app.init();
  });
  afterAll(async () => app.close());
  it('serves a stable health payload', async () => {
    await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok', service: 'quang-tam-blog' });
  });
  it.each(pages)('serves and validates %s', async (path) => {
    const response = await request(app.getHttpServer()).get(path).expect(200);
    assertPageStructure(response.text);
  });
  it('serves core static assets and SEO endpoints', async () => {
    await request(app.getHttpServer()).get('/assets/styles.css').expect(200);
    await request(app.getHttpServer()).get('/assets/script.js').expect(200);
    await request(app.getHttpServer()).get('/assets/img/preview-api.webp').expect(200).expect('Content-Type', /image\/webp/);
    await request(app.getHttpServer()).get('/robots.txt').expect(200).expect('Content-Type', /text\/plain/);
    const sitemap = await request(app.getHttpServer()).get('/sitemap.xml').expect(200);
    expect(sitemap.text).toContain('/series/java-spring/');
    expect(sitemap.text).not.toContain('/health');
  });
  it('returns 404 for an unknown route', async () => {
    await request(app.getHttpServer()).get('/khong-ton-tai/').expect(404);
  });
});
