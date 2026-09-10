import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import config from "../site.config.json" with { type: "json" };

const siteUrl = (process.env.SITE_URL ?? config.url).replace(/\/$/, "");
const pages = [
  "public/index.html",
  "public/archive/index.html",
  "public/series/java-spring/index.html",
  "public/api-comparison/index.html",
  "public/api-comparation/index.html",
];

for (const page of pages) {
  const file = join(process.cwd(), page);
  const html = await readFile(file, "utf8");
  const normalized = html.replace(
    /("@context"\s*:\s*")https?:\/\/[^"']+(\/"\s*[,}])/g,
    '$1https://schema.org$2',
  );
  const canonicalMatch = normalized.match(
    /rel=["']canonical["'][^>]+href=["'](https?:\/\/[^"']+)/i,
  );
  const pageOrigin = canonicalMatch ? new URL(canonicalMatch[1]).origin : null;
  const knownOrigins = new Set([
    new URL(config.url).origin,
    'https://blog.skillswap.asia',
    pageOrigin,
  ]);
  const updated = normalized.replace(/https?:\/\/[^"'\s<]+/g, (absoluteUrl) => {
    try {
      const url = new URL(absoluteUrl);
      const internalPath =
        url.pathname === "/archive/" ||
        url.pathname === "/series/java-spring/" ||
        url.pathname === "/api-comparation/" ||
        url.pathname === "/api-comparison/" ||
        url.pathname === "/sitemap.xml" ||
        /^\/assets\/img\/preview-[^/]+\.webp$/.test(url.pathname) ||
        url.pathname === "/";
      return knownOrigins.has(url.origin) && internalPath
        ? `${siteUrl}${url.pathname}${url.search}${url.hash}`
        : absoluteUrl;
    } catch {
      return absoluteUrl;
    }
  });
  if (updated !== html) await writeFile(file, updated, "utf8");
}
