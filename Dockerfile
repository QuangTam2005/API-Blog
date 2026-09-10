FROM node:22.13.0-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY nest-cli.json tsconfig.json ./
COPY site.config.json ./
COPY scripts ./scripts
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:22.13.0-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
RUN mkdir -p /app/data \
    && chown -R nodeapp:nodeapp /app/data
ENV DATABASE_PATH=/app/data/blog.sqlite
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=nodeapp:nodeapp --from=build /app/dist ./dist
COPY --chown=nodeapp:nodeapp --from=build /app/public ./public
COPY --chown=nodeapp:nodeapp --from=build /app/site.config.json ./site.config.json
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
USER nodeapp
CMD ["node", "dist/main.js"]
