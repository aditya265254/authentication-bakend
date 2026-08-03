FROM node:24.16.0-alpine

RUN npm install -g pnpm

WORKDIR /app

RUN mkdir -p /app/.pnpm-store
ENV PNPM_HOME=/app/.pnpm-store

COPY pnpm-lock.yaml package.json .npmrc* ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "start"]