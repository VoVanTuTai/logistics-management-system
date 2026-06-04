# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build

WORKDIR /app

ARG EXPO_PUBLIC_GATEWAY_BASE_URL
ARG EXPO_PUBLIC_REQUEST_TIMEOUT_MS=15000
ARG EXPO_PUBLIC_COURIER_ID=
ENV EXPO_PUBLIC_GATEWAY_BASE_URL=$EXPO_PUBLIC_GATEWAY_BASE_URL
ENV EXPO_PUBLIC_REQUEST_TIMEOUT_MS=$EXPO_PUBLIC_REQUEST_TIMEOUT_MS
ENV EXPO_PUBLIC_COURIER_ID=$EXPO_PUBLIC_COURIER_ID
ENV EXPO_NO_DEPENDENCY_VALIDATION=1
ENV EXPO_NO_DOCTOR=1
ENV EXPO_NO_METRO_WORKSPACE_ROOT=1

COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm-courier-mobile,target=/root/.npm npm ci

COPY . .
RUN npm run build:web

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/ || exit 1
