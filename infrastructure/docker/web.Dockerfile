FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY packages/ packages/
COPY apps/web/package.json apps/web/

RUN npm ci || npm install

COPY apps/web/ apps/web/

RUN npm run build --workspace=@landslide/web

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@landslide/web"]
