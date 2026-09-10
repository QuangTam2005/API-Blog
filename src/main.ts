import { NestFactory } from '@nestjs/core';
import compression = require('compression');
import type { NextFunction, Request, Response } from 'express';
const helmet = require('helmet') as (options: { contentSecurityPolicy: false }) => unknown;
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // The site is read-only; keep cross-origin access disabled unless a deployment
  // explicitly provides a comma-separated allow-list.
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors(
    allowedOrigins.length > 0 ? { origin: allowedOrigins } : { origin: false },
  );

  // Inline JSON-LD and the existing CDN assets are intentional for this static
  // site, so CSP is left for a later nonce-based migration.
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());

  const express = app.getHttpAdapter().getInstance();
  express.set('etag', 'weak');
  app.use((request: Request, response: Response, next: NextFunction) => {
    const path = request.path;
    if (path === '/health') {
      response.setHeader('Cache-Control', 'no-store');
    } else if (path === '/robots.txt' || path === '/sitemap.xml') {
      response.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    } else if (/\.(?:css|js|webp|avif|png|jpg|jpeg|svg|woff2?)$/i.test(path)) {
      // Fixed filenames are revalidated daily; this avoids stale CSS/JS while
      // still allowing browsers and social crawlers to reuse image responses.
      response.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
    } else {
      response.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
    }
    next();
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap();
