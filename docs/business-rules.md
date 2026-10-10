# Reglas de negocio

## Roles y permisos (mínimo privilegio)

Fuente de verdad: `ROLE_PERMISSIONS` en `packages/contracts/src/index.ts`. El seed sincroniza la BD con esa matriz y
elimina los permisos obsoletos.

| Permiso | ADMIN | PROJECT_MANAGER |
|---|:-:|:-:|
| `project:read` (incluye borradores) | ✔ | ✔ |
| `project:create` | ✔ | ✔ |
| `project:update` | ✔ | ✔ |
| `project:archive` | ✔ | ✔ |
| `media:upload` / `media:delete` | ✔ | ✔ |
| `project:publish` / `project:unpublish` | ✔ | ✘ |
| `project:delete` | ✔ | ✘ |
| `project:assign_author` | ✔ | ✘ |
| `service:read` / `service:write` | ✔ | ✘ |
| `lead:read` / `lead:update_status` | ✔ | ✘ |
| `audit:read` | ✔ | ✘ |
| `user:manage` / `role:manage` | ✔ | ✘ |

Para conceder un permiso a PROJECT_MANAGER, edite `ROLE_PERMISSIONS` y ejecute `pnpm db:seed`.

## Ciclo de vida de un proyecto

- Se crea siempre como `DRAFT`. El autor (`createdById`) lo fija el servidor.
- `DRAFT` / `ARCHIVED` → `PUBLISHED` (`project:publish`; fija `publishedAt`).
- `PUBLISHED` → `DRAFT` (`project:unpublish`; borra `publishedAt`).
- Cualquier estado → `ARCHIVED` (`project:archive`). No aparece en el sitio público.
- El estado nunca se cambia por `POST`/`PATCH` del proyecto: esos cuerpos rechazan `status`, `createdById` y `updatedById`.
- La descripción es texto plano; el HTML se muestra como texto.

## Solicitudes de cotización (leads)

- Creación pública, sin lectura pública.
- Campos: nombre, empresa (opcional), correo, teléfono, ubicación, servicio activo (opcional), descripción,
  `budgetRange` (rango cerrado, opcional) y `privacyAccepted: true` obligatorio.
- `consentAt` y `privacyNoticeVersion` los fija el servidor.
- `website` es un honeypot: si llega relleno, se responde 201 sin guardar nada.
- Límite de 3 solicitudes por minuto e IP. Turnstile es obligatorio en producción.

## Usuarios

- Solo `user:manage` crea y desactiva usuarios. Contraseña mínima de 12 caracteres (Argon2id).
- Desactivar un usuario revoca todas sus sesiones.
- Un administrador no puede desactivarse ni quitarse el rol ADMIN a sí mismo.

## Auditoría

Se registran: inicio de sesión; creación, edición, publicación, despublicación, archivo, borrado y cambio de autor de
proyectos; subida y borrado de imágenes; cambios de servicios, cotizaciones y usuarios.
