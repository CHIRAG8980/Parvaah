FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/ packages/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile || pnpm install

COPY apps/web/ apps/web/

RUN pnpm --filter @landslide/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@landslide/web", "start"]
