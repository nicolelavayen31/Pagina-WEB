# Arquitectura

## Decisión

Monorepo pnpm con un frontend Next.js y una API NestJS independiente. La lógica de dominio, la autorización y el
acceso a datos viven en la API. La web nunca importa código de base de datos.

## Componentes

- `apps/web`: sitio público (componentes de servidor que consultan la API) y panel administrativo (componentes de
  cliente). `src/proxy.ts` redirige `/admin/*` al login si no hay cookie de sesión; es solo una primera barrera.
- `apps/api`: módulos `auth`, `projects`, `media`, `services`, `leads`, `users`, `dashboard`, `audit`, `health`.
- `packages/contracts`: esquemas Zod de entrada (estrictos: rechazan campos desconocidos), esquema del entorno,
  matriz `ROLE_PERMISSIONS` y DTOs públicos.

## Flujo

```
Navegador ──> Next.js (:3000) ──rewrite /api/*──> API NestJS (:3001) ──> Prisma ──> PostgreSQL 18
                    │                                   └──> StorageService (disco local hoy; S3 compatible después)
                    └── componentes de servidor ──fetch──┘
```

Al compartir origen, la cookie de sesión es de primera parte y el navegador no necesita CORS.

## Autenticación

- Sesiones opacas: cookie `session_token` (`HttpOnly`, `SameSite=Lax`, `Secure` en producción) con 32 bytes
  aleatorios. En la tabla `Session` solo se guarda su SHA-256.
- En cada petición protegida se cargan de la BD la sesión, el usuario (`isActive`) y sus permisos, de modo que la
  revocación, la desactivación y los cambios de rol tienen efecto inmediato.
- `@RequirePermissions(...)` aplica `SessionAuthGuard` y `PermissionsGuard`. No se usan roles en los controladores,
  solo permisos.

## Almacenamiento de imágenes

`StorageService` es una clase abstracta. Hoy se usa `LocalStorageService` (`UPLOAD_DIR`, privado). Para pasar a S3,
Cloudflare R2 o MinIO basta con añadir otra implementación y registrarla en `MediaModule`; el resto del código no cambia.
Las imágenes se sirven por `GET /api/v1/media/:id`: públicas si el proyecto está publicado y, en caso contrario, solo
para usuarios con `project:read`.

## Redis

No se usa. El límite de peticiones es en memoria, lo que es correcto con **una sola instancia** de la API. Al escalar
horizontalmente, conectar `ThrottlerModule` a Redis.
