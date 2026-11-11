# Guía de desarrollo

Complementa [architecture.md](architecture.md). Aquí está el *cómo*: convenciones, cómo añadir funcionalidad y cómo
probarla.

## Convenciones

**Nombres de archivo** (kebab-case, el sufijo indica el papel):

| Papel | Ejemplo |
|---|---|
| Entidad / reglas de dominio | `domain/project.ts`, `domain/self-lockout.ts` |
| Errores de dominio | `domain/project.errors.ts` |
| Puerto | `application/ports/project.repository.ts`, `application/ports/image-processor.ts` |
| Caso de uso | `application/use-cases/create-project.use-case.ts` (clase `CreateProjectUseCase`, método `execute`) |
| Consultas de lectura | `application/project.queries.ts` (clase `ProjectQueries`) |
| Adaptador | `infrastructure/prisma-project.repository.ts` (prefijo = tecnología) |
| Controlador | `presentation/projects.controller.ts` |
| Pantalla web | `modules/admin/screens/users-screen.tsx` |

**Reglas de código:**

- TypeScript estricto. No usar `any`. Los `as` se reservan para fronteras con datos externos y llevan su justificación.
- Los controladores no tienen lógica: validan la entrada con `ZodValidationPipe` y delegan en un caso de uso o una
  consulta.
- Las reglas de negocio viven en `domain/` cuando son puras, o en el caso de uso cuando coordinan puertos.
- Toda escritura auditable llama a `AuditLogger.log({ actorId, action, entityType, entityId, metadata })`. Las acciones
  están tipadas en `audit/application/audit-logger.ts`.
- Los errores de negocio son subclases de `DomainError` con su mensaje en español para el usuario. No se lanzan
  `HttpException` fuera de `presentation/`.
- Los comentarios explican el *porqué* (seguridad, decisiones), no repiten el código.

## Cómo añadir una funcionalidad

Ejemplo: «destacar un proyecto».

1. **Contrato** (`packages/contracts/src/projects.ts`): añade el esquema Zod del cuerpo y, si cambia una respuesta,
   el tipo JSON (`AdminProject`…). Ejecuta `pnpm --filter @repo/contracts build`.
2. **Dominio** (`modules/projects/domain`): si hay una regla (p. ej. «solo los publicados pueden destacarse»), añádela
   a la entidad con su error de dominio y una prueba en `test/unit/projects/project.spec.ts`.
3. **Aplicación**: crea `application/use-cases/feature-project.use-case.ts`. Depende solo de puertos. Si necesitas una
   operación de persistencia nueva, añade el método abstracto al puerto.
4. **Infraestructura**: implementa el método nuevo en `PrismaProjectRepository`. Si cambia el esquema de la BD, crea
   una migración con `pnpm db:migrate`. Las migraciones se versionan y nunca deben ser destructivas sin revisión.
5. **Presentación**: añade el endpoint al controlador con `@RequirePermissions(...)`. Si hace falta un permiso nuevo,
   añádelo a `ROLE_PERMISSIONS` (`packages/contracts/src/permissions.ts`) y ejecuta `pnpm db:seed`.
6. **Composición**: registra el caso de uso en `providers` de `projects.module.ts`.
7. **Web**: añade la llamada en `modules/<dominio>/api.ts` o usa `mutate()` desde la pantalla, con los tipos de
   `@repo/contracts`.
8. **Pruebas**: añade una prueba unitaria del caso de uso con dobles en memoria y otra de integración del endpoint
   (`test/integration/*.int-spec.ts`).

**Módulo nuevo:** crea solo las capas que necesite (un CRUD sin reglas no necesita `domain/`) y regístralo en
`app.module.ts`. Si otro módulo debe consultarlo, publica un puerto en su `application/ports` y expórtalo desde su
`*.module.ts`. Nunca expongas un repositorio Prisma.

## Pruebas

| Comando | Qué ejecuta | Requiere |
|---|---|---|
| `pnpm test` | Unitarias de la API (`apps/api/test/unit`): dominio, casos de uso con dobles en memoria y guardas de contratos | — |
| `pnpm test:int` | Integración HTTP contra PostgreSQL real (`apps/api/test/integration`) | BD `*_test` en `apps/api/.env.test` |
| `pnpm test:e2e` | Playwright sobre los builds de producción de API y web | BD `*_test` y Chromium con sus librerías del sistema |
| `pnpm typecheck` | TypeScript en los 3 paquetes (incluye la comprobación de contratos de respuesta) | — |
| `pnpm lint` | ESLint, 0 avisos | — |

Base de datos de pruebas desechable con Docker (no toca la del puerto 5432):

```bash
docker run -d --name pagina-web-test-pg -e POSTGRES_USER=test -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=pagina_web_test -p 127.0.0.1:55432:5432 postgres:18
echo 'DATABASE_URL="postgresql://test:test@localhost:55432/pagina_web_test?schema=public"' > apps/api/.env.test
```

Las suites de integración y E2E se niegan a ejecutarse si el nombre de la base no termina en `_test`, y la vacían en
cada ejecución.

> Chromium para Playwright necesita librerías del sistema. En Debian/Ubuntu: `sudo pnpm --filter web exec playwright
> install-deps chromium`. En AlmaLinux/RHEL (`install-deps` no lo soporta):
>
> ```bash
> sudo dnf install -y nspr nss nss-util atk at-spi2-atk at-spi2-core alsa-lib mesa-libgbm \
>   libXcomposite libXdamage libXext libXfixes libXrandr
> ```
