import { readFileSync } from "node:fs";
import { join } from "node:path";

const config = JSON.parse(
  readFileSync(join(__dirname, "..", "site.config.json"), "utf8"),
) as { url: string; name: string; author: string };

export const siteConfig = {
  ...config,
  // Set SITE_URL in production when the deployment domain is known.
  url: (process.env.SITE_URL ?? config.url).replace(/\/$/, ""),
};
