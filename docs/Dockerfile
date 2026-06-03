# syntax=docker/dockerfile:1

# Vendor the Swagger UI static assets (no CDN dependency at runtime).
FROM node:22-alpine AS assets
WORKDIR /assets
RUN npm install swagger-ui-dist@5 --no-save

FROM nginx:1.27-alpine
# Serve everything under /docs so paths line up behind the reverse proxy.
WORKDIR /usr/share/nginx/html/docs
COPY --from=assets /assets/node_modules/swagger-ui-dist/swagger-ui.css ./
COPY --from=assets /assets/node_modules/swagger-ui-dist/swagger-ui-bundle.js ./
COPY --from=assets /assets/node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js ./
COPY --from=assets /assets/node_modules/swagger-ui-dist/favicon-32x32.png ./
COPY index.html ./
COPY swagger-initializer.js ./
COPY openapi.yaml ./
EXPOSE 80
