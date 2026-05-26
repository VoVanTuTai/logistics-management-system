# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

ARG VITE_GATEWAY_BFF_URL
ARG VITE_REQUEST_TIMEOUT_MS=15000
ENV VITE_GATEWAY_BFF_URL=$VITE_GATEWAY_BFF_URL
ENV VITE_REQUEST_TIMEOUT_MS=$VITE_REQUEST_TIMEOUT_MS

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-merchant-web,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1
