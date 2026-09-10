import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  Redirect,
} from "@nestjs/common";
import type { Response } from 'express';
import { join } from 'node:path';
import { PostViewsService } from './post-views.service';
import { isValidPostSlug, PUBLIC_POST_SLUGS } from './posts';
import { siteConfig } from "./site-config";

@Controller()
export class BlogController {
  constructor(private readonly postViews: PostViewsService) {}

  private page(response: Response, path: string) {
    return response.sendFile(join(process.cwd(), 'public', path, 'index.html'));
  }

  @Get()
  home(@Res() response: Response) {
    return this.page(response, '');
  }

  @Get('archive')
  archive(@Res() response: Response) {
    return this.page(response, 'archive');
  }

  @Get('series/java-spring')
  javaSpring(@Res() response: Response) {
    return this.page(response, 'series/java-spring');
  }

  @Get('api-comparison')
  apiComparison(@Res() response: Response) {
    return this.page(response, 'api-comparison');
  }

  @Get('api-comparation')
  @Redirect('/api-comparison/', HttpStatus.MOVED_PERMANENTLY)
  redirectLegacyPost() {}

  @Get("health")
  health() {
    return { status: "ok", service: "quang-tam-blog" };
  }

  @Post('api/posts/:slug/view')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  recordView(@Param('slug') slug: string) {
    if (!isValidPostSlug(slug) || !PUBLIC_POST_SLUGS.has(slug)) {
      throw new HttpException('Bài viết không tồn tại', HttpStatus.NOT_FOUND);
    }
    return this.postViews.increment(slug);
  }

  @Get('api/posts/:slug/views')
  @Header('Cache-Control', 'public, max-age=5, must-revalidate')
  getViews(@Param('slug') slug: string) {
    if (!isValidPostSlug(slug) || !PUBLIC_POST_SLUGS.has(slug)) {
      throw new HttpException('Bài viết không tồn tại', HttpStatus.NOT_FOUND);
    }
    return this.postViews.get(slug);
  }

  @Get("robots.txt")
  @Header("Content-Type", "text/plain; charset=utf-8")
  robots() {
    return `User-agent: *\nAllow: /\nDisallow: /health\n\nSitemap: ${siteConfig.url}/sitemap.xml\n`;
  }

  @Get("sitemap.xml")
  @Header("Content-Type", "application/xml; charset=utf-8")
  sitemap() {
    const urls = ["", "/archive/", "/series/java-spring/", "/api-comparison/"];
    const entries = urls
      .map((path) => `  <url><loc>${siteConfig.url}${path}</loc></url>`)
      .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  }
}
