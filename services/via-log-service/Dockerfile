# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Development ----------
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 8000
CMD ["npm", "run", "start:dev"]

# ---------- Build ----------
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && npm prune --omit=dev

# ---------- Runner (production) ----------
FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# The user-service .proto contract is loaded at runtime by the gRPC client.
COPY --from=build /app/proto ./proto
COPY package.json ./

RUN addgroup -S nodejs -g 1001 && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 8000 50051
CMD ["node", "dist/main.js"]
