# Arquitectura

## Decisión

Monorepo pnpm con un frontend Next.js y una API NestJS independiente. La lógica de dominio, la autorización y el
acceso a datos viven en la API. La web nunca importa código de base de datos ni tipos internos de la API: solo habla
HTTP y comparte con la API el paquete `@repo/contracts`.

La API sigue **Clean Architecture pragmática** con módulos por contexto (DDD ligero): cada módulo tiene solo las capas
que necesita. No hay capas vacías ni interfaces sin una segunda razón para existir.

## Componentes

| Paquete | Responsabilidad |
|---|---|
| `apps/api` | API NestJS: módulos `auth`, `users`, `projects`, `media`, `services`, `leads`, `audit`, `dashboard`, `health`. Esquema y migraciones Prisma. |
| `apps/web` | Sitio público (componentes de servidor que consultan la API) y panel administrativo (componentes de cliente). |
| `packages/contracts` | Formato del cable: esquemas Zod de entrada (estrictos), tipos JSON de las respuestas y vocabulario compartido (`ROLE_PERMISSIONS`, estados, rangos de presupuesto). El esquema del entorno es de la API (`apps/api/src/config/env.schema.ts`). |

## Flujo

```
Navegador ──> Next.js (:3000) ──rewrite /api/*──> API NestJS (:3001) ──> Prisma ──> PostgreSQL 18
                    │                                   └──> FileStorage (disco local hoy; S3 compatible después)
                    └── componentes de servidor ──fetch──┘
```

Al compartir origen, la cookie de sesión es de primera parte y el navegador no necesita CORS.

## API: capas y dirección de dependencias

```
presentation ──> application ──> domain
      │               ▲
      └──> infrastructure (implementa los puertos de application)
```

| Capa | Contiene | Puede depender de | No puede depender de |
|---|---|---|---|
| `domain/` | Entidades, reglas puras, errores de dominio | `common/domain` | NestJS, Prisma, Express, librerías de I/O, otras capas |
| `application/` | Casos de uso, consultas, **puertos** (clases abstractas), vistas de lectura | `domain`, otros `application/` (puertos publicados), `@repo/contracts` solo para vocabulario | Prisma, `infrastructure/`, `presentation/` |
| `infrastructure/` | Adaptadores: repositorios Prisma, Argon2, Sharp, Turnstile, almacenamiento | `application` (los puertos que implementa), `domain`, `common/persistence` | `presentation/` |
| `presentation/` | Controladores, guards, decoradores, pipes de validación con Zod | `application`, `@repo/contracts` (esquemas) | Prisma, `infrastructure/` |
| `<módulo>.module.ts` | Raíz de composición: enlaza cada puerto con su adaptador | Todas las capas del módulo | — |

Decisiones concretas:

- **Puertos = clases abstractas.** Sirven a la vez de tipo y de token de inyección de NestJS
  (`{ provide: ProjectRepository, useClass: PrismaProjectRepository }`), sin símbolos ni `@Inject`.
- **`@Injectable()` en la capa de aplicación** es la única concesión al framework: no acopla la lógica, solo permite
  la inyección. El dominio no importa nada de NestJS.
- **Errores.** El dominio y la aplicación lanzan subclases de `DomainError` (`NotFoundError`, `ConflictError`,
  `InvalidOperationError`, `UnsupportedContentError`, `UnauthenticatedError`, `DependencyUnavailableError`).
  `AllExceptionsFilter` las traduce a HTTP (`{ statusCode, message, error }`). Las excepciones HTTP de Nest solo se
  usan en la capa de presentación (guards, validación de la petición).
- **Lectura y escritura separadas donde aporta.** En `projects`, las lecturas usan `ProjectReader`, que devuelve vistas
  listas (la proyección pública que oculta autoría y claves de almacenamiento vive en un único sitio), y las
  escrituras usan `ProjectRepository` y la entidad `Project`.
- **Comunicación entre módulos** solo por puertos publicados de la capa de aplicación, en una única dirección:

```
projects ──> users (UserDirectory)          leads ──> services (ServiceQueries)
media ──> projects (errores de dominio)     media, users ──> auth (SessionService, PasswordHasher)
todos ──> audit (AuditLogger)               dashboard ──> projects (tipo ProjectStatus)
```

No hay dependencias circulares entre archivos (verificado con un análisis de importaciones).

## API: módulos

| Módulo | Domain | Application | Infrastructure |
|---|---|---|---|
| `projects` | Entidad `Project` (ciclo de publicación), errores | `ProjectQueries`, casos de uso de creación, edición, cambio de estado, asignación de autor y borrado | `PrismaProjectRepository`, `PrismaProjectReader` |
| `media` | Detección de formato por firma binaria, clave de almacenamiento, orden | Subir, borrar y entregar imágenes | `PrismaProjectImageRepository`, `SharpImageProcessor` |
| `auth` | Token de sesión (generación y hash), validez de la sesión | `LoginUseCase`, `SessionService` | Repositorios Prisma, `Argon2PasswordHasher`, sincronización RBAC |
| `users` | Regla anti auto-bloqueo, errores | Listar, crear y editar usuarios; `UserDirectory` | `PrismaUserRepository`, `PrismaUserDirectory` |
| `leads` | Honeypot, estados, errores | `SubmitLeadUseCase`, listar, cambiar estado | `PrismaLeadRepository`, `TurnstileHumanVerifier` |
| `services` | Errores | `ServiceQueries`, crear y editar | `PrismaServiceRepository` |
| `audit` | — | Puertos `AuditLogger` y `AuditLogReader` (acciones tipadas) | `PrismaAuditRepository` |
| `dashboard` | — | `GetDashboardSummaryUseCase` (bloques según permisos) | `PrismaDashboardStats` |
| `health` | — | — | Controlador que consulta la BD directamente: comprobar la infraestructura es su función |

Piezas transversales en `apps/api/src`:

- `common/domain`: `DomainError` y sus tipos.
- `common/application`: `PageRequest` y `Page<T>`.
- `common/persistence`: `PrismaService`, el helper `paginate` y el mapeo de errores de Prisma.
- `common/storage`: el puerto `FileStorage` y el adaptador `LocalFileStorage`.
- `common/presentation`: `AllExceptionsFilter`, `ZodValidationPipe`, `ParseCuidPipe` y los límites de peticiones.
- `config/`: esquema y validación del entorno, endurecimiento HTTP.

**Identificadores en la URL:** las tablas con `@default(uuid())` (proyectos, imágenes, cotizaciones) usan
`ParseUUIDPipe`; las de `@default(cuid())` (usuarios, servicios) usan `ParseCuidPipe`. En ambos casos un id mal formado
responde 400 y uno bien formado pero inexistente, 404.

`common/` no depende de ningún módulo.

## Web: organización

```
apps/web/src/
├── app/          Solo enrutamiento (páginas, layouts, metadata). Las páginas de administración son envoltorios de una línea.
├── modules/      Funcionalidad por dominio: auth, projects, services, contact, admin (componentes, pantallas, hooks y api.ts).
├── components/   UI reutilizable sin dominio: cabecera, pie, iconos, hero, carrusel, botón de WhatsApp.
├── shared/       Infraestructura sin UI: cliente HTTP (`shared/api/client.ts`), utilidades y contenido estático.
└── proxy.ts      Redirige /admin/* al login si no hay cookie de sesión (solo una primera barrera).
```

- Las llamadas a la API de cada dominio viven en `modules/<dominio>/api.ts` y usan `apiFetch` de `shared/api/client.ts`.
- Los tipos de las respuestas vienen de `@repo/contracts` (`AdminProject`, `AdminLead`…), nunca se redefinen en la web.
- `test/unit/contracts/response-contracts.spec.ts` (API) comprueba al compilar que las vistas de la API y esos tipos
  describen el mismo JSON.

## Autenticación

- Sesiones opacas: cookie `session_token` (`HttpOnly`, `SameSite=Lax`, `Secure` en producción) con 32 bytes
  aleatorios. En la tabla `Session` solo se guarda su SHA-256.
- En cada petición protegida, `SessionService.resolve` carga de la BD la sesión, el usuario (`isActive`) y sus
  permisos, de modo que la revocación, la desactivación y los cambios de rol tienen efecto inmediato.
- `@RequirePermissions(...)` (`auth/presentation`) aplica `SessionAuthGuard` y `PermissionsGuard`. No se usan roles
  en los controladores, solo permisos.

## Almacenamiento de imágenes

`FileStorage` (`common/storage`) es un puerto. Hoy se usa `LocalFileStorage` (`UPLOAD_DIR`, privado). Para pasar a
S3, Cloudflare R2 o MinIO basta con añadir otra implementación y registrarla en `StorageModule`; el resto del código
no cambia. Las imágenes se sirven por `GET /api/v1/media/:id`: públicas si el proyecto está publicado y, en caso
contrario, solo para usuarios con `project:read`.

## Redis

No se usa. El límite de peticiones es en memoria, lo que es correcto con **una sola instancia** de la API. Al escalar
horizontalmente, conectar `ThrottlerModule` a Redis.
