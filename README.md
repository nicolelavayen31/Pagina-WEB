# Mantenimientos Integrales y Construcciones

Sitio web corporativo público y panel administrativo privado para una empresa de construcción y mantenimiento.

## Stack (versiones instaladas)

| Componente | Versión |
|---|---|
| Node.js | 24 (probado con 24.15) |
| pnpm | 10.15.0 (vía Corepack: `corepack pnpm …`) |
| Next.js / React | 16.4.6 / 19.3.0 |
| Tailwind CSS | 4 (solo tema y utilidades, sin *preflight*) |
| NestJS | 11 |
| Prisma (CLI y Client) | 6.19.3 |
| Zod | 4.6.6 |
| PostgreSQL | 18 |
| Redis | No usado todavía (opcional, ver `docker-compose.yml`) |

## Estructura

- `apps/web` — sitio público y panel administrativo (Next.js). `app/` solo enruta; la funcionalidad vive en
  `src/modules/<dominio>`. El navegador solo habla con Next; `/api/*` se reenvía a la API.
- `apps/api` — API NestJS con Clean Architecture por módulos (`domain` / `application` / `infrastructure` /
  `presentation`), esquema y migraciones Prisma, seed.
- `packages/contracts` — formato del cable: esquemas Zod, tipos de respuesta y permisos por rol.
- `docs/` — [arquitectura](docs/architecture.md), [guía de desarrollo](docs/development.md),
  [reglas de negocio](docs/business-rules.md), [seguridad](docs/security.md) y [despliegue](docs/deployment.md).

## Puesta en marcha local (Windows, sin Docker)

Requisitos: Node 24, PostgreSQL 18 en ejecución y una base de datos creada.

```powershell
corepack pnpm install
copy apps\api\.env.example apps\api\.env        # completar DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD
copy apps\web\.env.example apps\web\.env.local
corepack pnpm db:generate
corepack pnpm db:deploy                          # aplica las migraciones versionadas
corepack pnpm db:seed                            # roles, permisos, servicios iniciales y primer admin
corepack pnpm dev                                # web en :3000, API en :3001
```

Panel: http://localhost:3000/admin. Después del primer seed, elimine `ADMIN_PASSWORD` de `apps/api/.env`.

> El seed es idempotente: no sobrescribe contraseñas existentes ni servicios editados desde el panel.

## Comandos de verificación

| Comando | Qué hace | Requiere |
|---|---|---|
| `corepack pnpm lint` | ESLint (API y web), 0 avisos permitidos | — |
| `corepack pnpm typecheck` | TypeScript en los 3 paquetes | — |
| `corepack pnpm test` | Pruebas unitarias de la API (dominio y casos de uso, sin BD) | — |
| `corepack pnpm test:int` | Pruebas de integración contra PostgreSQL real | BD `*_test` |
| `corepack pnpm test:e2e` | Playwright: compila API y web y las prueba en :3101/:3100 | BD `*_test`, Chromium |
| `corepack pnpm build` | Build de producción de los 3 paquetes | — |

### Base de datos de pruebas

Las pruebas de integración y E2E **se niegan a ejecutarse** si el nombre de la base de datos no termina en `_test`.
Cree `apps/api/.env.test` (no se versiona) con:

```
DATABASE_URL="postgresql://USUARIO:CLAVE@localhost:5432/mantenimiento_db_test?schema=public"
```

Las suites vacían esa base en cada ejecución.

## Producción

`node apps/api/dist/main.js` y `next start`. La API **no arranca** en producción sin `TURNSTILE_SECRET_KEY`.
Consulte [docs/deployment.md](docs/deployment.md) y [docs/security.md](docs/security.md).
