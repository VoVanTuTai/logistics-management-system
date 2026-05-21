FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json tsconfig.json ./
COPY src ./src

RUN corepack pnpm install
RUN corepack pnpm build

EXPOSE 3012

CMD ["node", "dist/main.js"]
