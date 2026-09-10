# Quang Tâm Blog

Personal engineering blog of Võ Quang Tâm, an FPTU Software Engineering student. The first article is the API architecture learning note at:

```text
http://localhost:3000/api-comparation/
```

## Structure

- `public/index.html` — personal blog homepage.
- `public/archive/index.html` — extensible article archive.
- `public/api-comparation/index.html` — first blog article.
- `public/assets/` — shared styles and interactive article scripts.
- `site.config.json` — site URL, site name and author source of truth.
- `scripts/sync-site-url.mjs` — syncs `SITE_URL` into static SEO metadata before build.
- `src/` — NestJS server and static-file configuration.

Each new article can be added as a folder under `public/<slug>/index.html`; NestJS serves it automatically at `http://localhost:3000/<slug>/` locally.

## Run locally

```bash
npm install
npm run start:dev
```

Open `http://localhost:3000` or `http://localhost:3000/api-comparation/`.
The health endpoint is available at `http://localhost:3000/health`.
SEO routes are served by NestJS at `/robots.txt` and `/sitemap.xml`. Set `SITE_URL` to a domain you control in production to override `site.config.json`; the build step synchronises the value into static metadata.

## Run with Docker

```bash
docker compose up -d --build
```

Open `http://localhost:8091`.

The container binds to `127.0.0.1:8091` so it does not conflict with an existing service on port `8090`. For Nginx, proxy the domain you control to `http://127.0.0.1:8091`.
