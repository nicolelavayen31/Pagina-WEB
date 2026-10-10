# Mantenimientos Integrales y Construcciones

This repository contains the first production-oriented monorepo skeleton for a public corporate website and a private administrative panel for a construction and maintenance company.

## Stack

- Node.js 24 LTS
- Next.js 16.4.0
- React 19.3.0
- Tailwind CSS 4.3.3
- NestJS 11.x
- Prisma 7.10.0
- PostgreSQL 17
- Redis 7.4
- pnpm 10.15.0

## Version decisions

The original brief requested Prisma 7.x and NestJS 11.x as the target line. The registry currently exposes stable Prisma 7.10.0 and NestJS 11.x packages, so this project pins to those stable releases. Corporate and legal content in the public copy is intentionally kept generic and marked for final review.

## Quick start

1. Install dependencies with pnpm.
2. Copy `.env.example` to `.env` and set the required values.
3. Start PostgreSQL and Redis using Docker Compose.
4. Run `pnpm db:generate` and `pnpm db:migrate`.
5. Run `pnpm dev` to start the web and API workspaces.

## Structure

- `apps/web` — public website and private admin UI
- `apps/api` — NestJS API and Prisma schema
- `packages/contracts` — shared Zod validation schema and public DTOs

## Security notes

- No default passwords are committed.
- Administrative access is restricted to authenticated backend checks.
- Public endpoints only expose published content and do not leak admin data.
- File uploads are validated before storage.

## Deployment

Use Docker or a managed hosting environment with HTTPS, a reverse proxy, Redis, PostgreSQL, and private object storage. Detailed production deployment and rollback steps are documented in the `docs` folder.
