FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN corepack pnpm install
RUN corepack pnpm build

EXPOSE 3009

CMD ["node", "dist/main.js"]
