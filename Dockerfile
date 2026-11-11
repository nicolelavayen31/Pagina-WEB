# syntax=docker/dockerfile:1
# One image for the API and the web app (docker-compose.prod.yml starts it twice with different commands).
# Both share every layer, so the server stores it only once.

FROM node:24-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate && chmod -R a+rX /opt/corepack
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* values and the rewrite target are fixed at build time by Next.js.
ARG API_INTERNAL_URL=http://api:3001
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
ARG NEXT_PUBLIC_WHATSAPP_NUMBER=""
ARG NEXT_PUBLIC_CONTACT_PHONE=""
ARG NEXT_PUBLIC_CONTACT_EMAIL=""
ARG NEXT_PUBLIC_CONTACT_ADDRESS=""
ARG NEXT_PUBLIC_CONTACT_HOURS=""
ENV API_INTERNAL_URL=$API_INTERNAL_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER \
    NEXT_PUBLIC_CONTACT_PHONE=$NEXT_PUBLIC_CONTACT_PHONE \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_CONTACT_ADDRESS=$NEXT_PUBLIC_CONTACT_ADDRESS \
    NEXT_PUBLIC_CONTACT_HOURS=$NEXT_PUBLIC_CONTACT_HOURS

RUN pnpm --filter @repo/contracts build \
  && pnpm db:generate \
  && pnpm --filter api build \
  && pnpm --filter web build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app /app
# Private image storage (mounted as a volume; never served directly).
RUN mkdir -p /data/uploads && chown -R node:node /data
USER node
EXPOSE 3000 3001
