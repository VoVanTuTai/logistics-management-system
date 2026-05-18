FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate --schema prisma/schema.prisma
CMD ["node", "dist/main.js"]
