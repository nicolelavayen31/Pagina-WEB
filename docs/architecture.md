# Arquitectura

## Decision

This project uses a monorepo with a public Next.js frontend and an independent NestJS API. Domain logic stays in the API layer, while the web app consumes read-only public endpoints and renders administrative screens for authenticated staff.

## Components

- `apps/web`: public marketing site and admin UI
- `apps/api`: business rules, auth, authorization, database access, and public endpoints
- `packages/contracts`: shared validation and DTO models
- `docker-compose.yml`: local PostgreSQL and Redis bootstrap

## Dependency flow

Frontend -> API -> Prisma -> PostgreSQL
              \-> Redis for rate limiting and session cache
              \-> S3-compatible object storage abstraction

The web app never imports database logic or backend infrastructure directly.
