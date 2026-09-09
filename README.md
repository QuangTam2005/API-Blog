# SkillSwap Blog

Static, multi-article blog powered by NestJS. The first article is the API architecture field note at:

```text
https://blog.skillswap.asia/api-comparation/
```

## Structure

- `public/index.html` — blog homepage and article directory.
- `public/api-comparation/index.html` — first blog article.
- `public/assets/` — shared styles and interactive article scripts.
- `src/` — NestJS server and static-file configuration.

Each new blog can be added as a folder under `public/<slug>/index.html`; NestJS serves it automatically at `blog.skillswap.asia/<slug>/`.

## Run locally

```bash
npm install
npm run start:dev
```

Open `http://localhost:3000` or `http://localhost:3000/api-comparation/`.
The health endpoint is available at `http://localhost:3000/health`.

## Run with Docker

```bash
docker compose up -d --build
```

Open `http://localhost:8091`.

The container binds to `127.0.0.1:8091` so it does not conflict with an existing service on port `8090`. For Nginx, proxy `blog.skillswap.asia` to `http://127.0.0.1:8091` and keep any authentication rules scoped to the protected application's domain.
