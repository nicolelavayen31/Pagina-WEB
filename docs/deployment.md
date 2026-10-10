# Despliegue

> El entorno de producción (VPS o PaaS, dominio) aún no está decidido. Este documento fija los requisitos que
> cualquier opción debe cumplir. Los Dockerfiles se escribirán cuando se elija la plataforma.

## Topología recomendada

```
Internet ──HTTPS──> Caddy/Nginx (TLS, sobrescribe X-Forwarded-For)
                      └──> Next.js `next start` (:3000)  ──/api/*──> API `node dist/main.js` (:3001, solo red interna)
                                                                         └──> PostgreSQL 18 (red interna)
```

- Solo el proxy expone puertos. La API y PostgreSQL no deben ser accesibles desde Internet.
- `UPLOAD_DIR` en un volumen persistente **privado** (no lo sirva el proxy) e incluido en las copias de seguridad.

## Variables de entorno

Ver `apps/api/.env.example` y `apps/web/.env.example`. En producción:

- `NODE_ENV=production` activa la cookie `Secure` y HSTS, y exige `TURNSTILE_SECRET_KEY`.
- `CORS_ORIGIN=https://www.su-dominio`.
- `TRUST_PROXY=1` (la API solo recibe tráfico de Next).
- `DATABASE_URL` con un usuario dedicado, no `postgres`.
- `API_INTERNAL_URL` apunta a la API por la red interna. Se usa en el build (*rewrites*) y en ejecución.

## Procedimiento de publicación

1. CI en verde (lint, typecheck, unitarias, integración, build y E2E).
2. **Copia de seguridad** de la BD: `pg_dump -Fc -f backup-AAAAMMDD.dump <db>`.
3. `pnpm install --frozen-lockfile && pnpm build`.
4. `pnpm db:deploy` (`prisma migrate deploy`). **Nunca** `migrate dev` ni `migrate reset` en producción.
5. `pnpm db:seed` si cambió `ROLE_PERMISSIONS` o el catálogo inicial (idempotente).
6. Reiniciar la API y la web. Comprobar `GET /api/v1/health/ready` → `{"status":"ready","database":"up"}`.

## Rollback

- **Código:** volver a desplegar el commit o la imagen anterior.
- **Migraciones:** escribirlas aditivas (columnas que admiten nulos, tablas nuevas) para que el código anterior siga
  funcionando con el esquema nuevo. Así el rollback de código no exige tocar la BD.
- **Migración destructiva fallida:** detener la app, `pg_restore -c -d <db> backup-AAAAMMDD.dump` y volver a
  desplegar la versión anterior.

## Pendiente de decidir

- Plataforma (VPS con Docker Compose o PaaS) → Dockerfiles y archivo Compose de producción.
- Proveedor S3 compatible para imágenes (sustituye a `LocalStorageService`).
- Redis, solo si se ejecutan varias instancias de la API.
