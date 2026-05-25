# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-payment-service,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm build
RUN pnpm prune --prod \
  && rm -rf node_modules/.pnpm/prisma@* node_modules/.pnpm/@prisma+engines@* node_modules/.pnpm/typescript@* \
  && rm -rf node_modules/prisma node_modules/typescript node_modules/@prisma/engines \
  && find node_modules -type f \( -name '*.map' -o -name '*.d.ts' -o -name '*.tsbuildinfo' -o -name 'README*' -o -name 'CHANGELOG*' \) -delete \
  && find node_modules -type d \( -name test -o -name tests -o -name __tests__ -o -name docs -o -name doc -o -name example -o -name examples -o -name coverage \) -prune -exec rm -rf '{}' + \
  && find node_modules -path '*/@prisma/client/runtime/*' -type f \( -name '*cockroachdb*' -o -name '*mysql*' -o -name '*sqlite*' -o -name '*sqlserver*' -o -name '*edge*' -o -name '*react-native*' -o -name '*wasm*' -o -name 'binary.*' \) -delete \
  && find node_modules -name 'query_engine-windows.dll.node' -delete

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3011

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1:3011/health || exit 1

CMD ["node", "dist/main.js"]
