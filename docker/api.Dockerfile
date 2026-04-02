# API container for `docker compose --profile app up` (Docker network hostnames).
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
COPY packages/ai/package.json ./packages/ai/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci

COPY apps ./apps
COPY packages ./packages

EXPOSE 4000
ENV API_PORT=4000
CMD ["npx", "tsx", "apps/api/src/index.ts"]
