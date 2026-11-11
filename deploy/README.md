# Publicar el sitio en Internet

Guía paso a paso para un VPS con Docker. Probada de punta a punta en local el 2026-11-11 (HTTPS, cotización,
panel, subida de imágenes, usuario de BD sin privilegios y copia de seguridad).

```
Internet ─HTTPS─> Caddy (certificado automático) ─> web :3000 ─/api─> api :3001 ─> PostgreSQL 18
                  (único servicio con puertos)       (todo lo demás solo en la red interna de Docker)
```

| Archivo | Para qué |
|---|---|
| `Dockerfile` | Una sola imagen para API y web (comparten capas, ocupa ~1,8 GB una vez). |
| `docker-compose.prod.yml` | Postgres, API, web y Caddy. |
| `deploy/Caddyfile` | HTTPS automático, redirección `www` → dominio y `X-Forwarded-For` real. |
| `deploy/postgres-init/01-app-user.sh` | Crea el usuario `app` (dueño de la BD, **no** superusuario). |
| `deploy/.env.production.example` | Plantilla de configuración. La real (`deploy/.env.production`) nunca se sube a git. |
| `deploy/backup.sh` | Copia diaria de BD + imágenes, conserva 14 días. |

## 0. Cuentas que hay que crear (una vez)

| Servicio | Para qué | Costo referencial (nov-2026, confirmar) |
|---|---|---|
| [Hetzner Cloud](https://www.hetzner.com/cloud) | Servidor **CX23** (2 vCPU, 4 GB RAM, 40 GB NVMe), Ubuntu 24.04 | ≈ €5,49–5,99/mes + backups opcionales (+20 %) |
| [Cloudflare](https://dash.cloudflare.com) | Comprar el dominio `.com` (al costo), DNS y claves Turnstile | ≈ USD 10,5/año el `.com`; DNS y Turnstile gratis |
| [Resend](https://resend.com) | Correo de aviso de cotizaciones | Gratis hasta 3.000 correos/mes |
| [UptimeRobot](https://uptimerobot.com) | Aviso si el sitio se cae | Gratis |

> Si prefieren dominio `.com.ec`, se compra en [nic.ec](https://nic.ec) (≈ USD 35–40/año) y se apuntan sus DNS a
> Cloudflare. Si el CX23 no está disponible, el **CPX22** o similar de Hetzner sirve igual.

## 1. En tu computadora

```bash
# Llave SSH para entrar al servidor (si no tienes una). Copia el contenido del .pub en Hetzner al crear el servidor.
ssh-keygen -t ed25519 -C "servidor-pagina-web"
cat ~/.ssh/id_ed25519.pub

# Subir el código
cd ~/proyecto-personal/Pagina-WEB
git add -A && git commit -m "feat: despliegue en producción" && git push
```

Crea el servidor en Hetzner: **Ubuntu 24.04**, tipo **CX23**, ubicación Núremberg o Falkenstein, tu llave SSH,
y marca **Backups**. Anota la **IP**.

## 2. Dominio, DNS y claves (en el navegador)

1. Cloudflare → *Domain Registration* → compra el dominio.
2. Cloudflare → DNS → crea dos registros **A**: `@` → IP del servidor y `www` → IP del servidor, ambos en
   **DNS only (nube gris)**. Así la IP real del visitante llega al servidor (lo usa el límite anti-spam).
3. Cloudflare → *Turnstile* → *Add site* → dominio → copia **Site Key** y **Secret Key**.
4. Resend → *Domains* → añade el dominio y crea en Cloudflare los registros DNS que te indique → *API Keys* →
   crea una clave.

## 3. Preparar el servidor (como root, una sola vez)

```bash
ssh root@IP_DEL_SERVIDOR

apt update && apt upgrade -y
apt install -y git ufw unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

# Usuario de trabajo con tu misma llave SSH
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy

# Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy

# Firewall: solo SSH, HTTP y HTTPS
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp
ufw --force enable

# Memoria de intercambio (la compilación de Next.js la necesita con 4 GB)
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Sin acceso root ni contraseñas por SSH (prueba antes "ssh deploy@IP" en otra terminal)
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
exit
```

## 4. Instalar el sitio (como `deploy`)

```bash
ssh deploy@IP_DEL_SERVIDOR

git clone https://github.com/USUARIO/Pagina-WEB.git && cd Pagina-WEB
# Si el repositorio es privado: crea un token de solo lectura en GitHub (Settings → Developer settings →
# Fine-grained tokens → Contents: Read) y úsalo como contraseña al clonar.

cp deploy/.env.production.example deploy/.env.production
chmod 600 deploy/.env.production
# Genera las dos contraseñas de BD y pégalas en el archivo:
openssl rand -base64 32 | tr -d '/+=' | cut -c1-32
openssl rand -base64 32 | tr -d '/+=' | cut -c1-32
nano deploy/.env.production      # completa dominio, contraseñas, Turnstile, Resend, contacto y admin

# Atajo para no repetir opciones
echo 'alias dc="docker compose -f docker-compose.prod.yml --env-file deploy/.env.production"' >> ~/.bashrc
source ~/.bashrc

dc build                                                   # 5-10 minutos la primera vez
dc up -d postgres
dc run --rm --no-deps api ./node_modules/.bin/prisma migrate deploy
dc run --rm --no-deps api ./node_modules/.bin/ts-node --transpile-only prisma/seed.ts
dc up -d
dc ps                                                      # todo "Up"; api y postgres "healthy"
```

Comprobar:

```bash
curl -s https://TU_DOMINIO/api/v1/health/ready            # {"status":"ready","database":"up"}
```

En el navegador: abre el sitio, envía una cotización de prueba (debe llegar el correo) y entra a
`https://TU_DOMINIO/admin` con `ADMIN_EMAIL` / `ADMIN_PASSWORD`. **Luego borra la contraseña del archivo:**

```bash
sed -i 's/^ADMIN_PASSWORD=.*/ADMIN_PASSWORD=/' deploy/.env.production
dc up -d api
```

## 5. Copias de seguridad y monitoreo

```bash
chmod +x deploy/backup.sh && ./deploy/backup.sh           # primera copia manual
(crontab -l 2>/dev/null; echo "30 3 * * * $HOME/Pagina-WEB/deploy/backup.sh >> $HOME/backup.log 2>&1") | crontab -
```

- Las copias quedan en `deploy/backups/` (14 días). Los **Backups de Hetzner** guardan además el servidor completo
  fuera de él. Descarga una copia a otro lugar de vez en cuando:
  `scp deploy@IP:Pagina-WEB/deploy/backups/db-*.dump .`
- UptimeRobot → monitor HTTP(s) a `https://TU_DOMINIO/api/v1/health/ready` cada 5 minutos.
- Google Search Console → añade el dominio y envía `https://TU_DOMINIO/sitemap.xml`.

## Actualizar el sitio (cada nueva versión)

```bash
ssh deploy@IP_DEL_SERVIDOR && cd Pagina-WEB
./deploy/backup.sh
git pull
dc build
dc run --rm --no-deps api ./node_modules/.bin/prisma migrate deploy
dc up -d
dc ps
```

Si cambian `NEXT_PUBLIC_*`/datos de contacto en `deploy/.env.production`, hace falta `dc build` (se fijan al compilar).

## Problemas comunes

| Síntoma | Revisión |
|---|---|
| El certificado HTTPS no se emite | DNS en «DNS only» y apuntando a la IP; puertos 80/443 abiertos. `dc logs caddy` |
| La API no arranca | `dc logs api`: suele ser una variable vacía (Turnstile, dominio). |
| El formulario dice «verificación no disponible» | Claves Turnstile del dominio correcto. |
| No llegan correos | Dominio verificado en Resend y `LEAD_NOTIFY_FROM` con ese dominio. `dc logs api` |
| Ver registros | `dc logs -f --tail=100 web api` |

## Restaurar una copia

```bash
dc stop api web
dc exec -T postgres pg_restore -U postgres -d mantenimientos --clean --if-exists < deploy/backups/db-AAAAMMDD-HHMM.dump
dc run --rm --no-deps -T --entrypoint tar api xzf - -C /data < deploy/backups/uploads-AAAAMMDD-HHMM.tar.gz
dc up -d
```
