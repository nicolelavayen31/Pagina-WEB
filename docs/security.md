# Seguridad

## Controles implementados

| Área | Control | Verificado por |
|---|---|---|
| Sesiones | Token aleatorio de 256 bits; solo el hash SHA-256 en BD; revocación en logout y al desactivar | `auth.int-spec.ts` |
| Contraseñas | Argon2id; tiempo comparable para usuarios inexistentes; mensaje de error genérico | `auth.int-spec.ts` |
| Autorización | Permisos leídos de la BD en cada petición; matriz rol × endpoint | `permissions.int-spec.ts` |
| Entrada | Zod estricto en todos los cuerpos y *queries*; los errores devuelven 400, nunca 500 | `leads`/`projects` int-spec |
| XSS | Sin `dangerouslySetInnerHTML`; descripciones en texto plano; CSP | E2E `public-site.spec.ts` |
| CSRF | `SameSite=Lax` y rechazo de escrituras con `Origin` no permitido | `security.int-spec.ts` |
| Fuerza bruta y spam | Login 5/min, cotizaciones 3/min por IP; honeypot; Turnstile en producción | `rate-limit.int-spec.ts` |
| Cabeceras | API: helmet (CSP, HSTS, nosniff…). Web: CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` | int-spec y E2E |
| Archivos | Firma binaria, límite de tamaño, recodificación WebP sin EXIF, claves generadas por el servidor, ruta confinada | `media.int-spec.ts` |
| Datos públicos | `select` explícito: sin autoría, estado ni claves de almacenamiento | `projects.int-spec.ts` |
| Errores | Filtro global: sin trazas en las respuestas; los errores 5xx se registran en el log | `security.int-spec.ts` |
| Entorno | Validación al arrancar; la API no arranca en producción sin Turnstile | `contracts.spec.ts` |

## Riesgos aceptados y pendientes

- **Usuario de BD:** la API local se conecta como `postgres` (superusuario). En producción, cree un usuario
  propietario solo de la base de la aplicación.
- **`ADMIN_PASSWORD` en `.env`:** bórrelo tras el primer seed.
- **`pnpm audit`:** `deepmerge-ts < 8` llega como dependencia transitiva del CLI de Prisma (`@prisma/config`). Solo se
  ejecuta con configuración propia y no con datos de usuarios. Ninguna versión de Prisma 6 o 7 lo corrige todavía.
  Riesgo aceptado; revisar en cada actualización de Prisma.
- **IP real y límite de peticiones:** `TRUST_PROXY` debe coincidir con el número de proxies. Next conserva un
  `X-Forwarded-For` entrante, así que en producción un proxy frontal (Caddy/Nginx) **debe sobrescribirlo** con la IP
  del cliente.
- **CSP con `'unsafe-inline'`** en scripts, necesaria para Next sin *nonces*. Mejora futura: CSP con nonce en `proxy.ts`.
- **Límite de peticiones en memoria:** válido con una sola instancia de la API.
