import { Controller, Get, Header } from "@nestjs/common";
import { siteConfig } from "./site-config";

@Controller()
export class BlogController {
  @Get("health")
  health() {
    return { status: "ok", service: "quang-tam-blog" };
  }

  @Get("robots.txt")
  @Header("Content-Type", "text/plain; charset=utf-8")
  robots() {
    return `User-agent: *\nAllow: /\nDisallow: /health\n\nSitemap: ${siteConfig.url}/sitemap.xml\n`;
  }

  @Get("sitemap.xml")
  @Header("Content-Type", "application/xml; charset=utf-8")
  sitemap() {
    const urls = ["", "/archive/", "/series/java-spring/", "/api-comparation/"];
    const entries = urls
      .map((path) => `  <url><loc>${siteConfig.url}${path}</loc></url>`)
      .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  }
}
