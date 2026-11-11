# Logos de clientes

Logos que muestra la sección «Han confiado en nosotros» de la página de inicio. Los datos (nombre, sector,
ubicación y archivo) están en `apps/web/src/shared/content/clients.ts`.

## Cómo añadir un logo

1. Usar el logo **oficial** entregado por el cliente o descargado de su sitio oficial, **con su autorización**
   para mostrarlo como referencia. Las instituciones públicas (MSP, direcciones distritales) suelen exigir
   autorización expresa para usar su imagen institucional.
2. Formato: SVG (preferido) o PNG/WebP con fondo transparente, ancho máximo de 400 px.
3. Nombre en minúsculas con guiones, igual al `id` del cliente: `ucsg.svg`, `edimca.png`…
4. En `clients.ts`, añadir al cliente `logo: 'ucsg.svg'`.

Mientras un cliente no tenga logo, se muestra una tarjeta con sus iniciales.

## Origen de los logos actuales (2026-11-11)

| Archivo | Fuente | Placa |
|---|---|---|
| `ucsg-logo.png` | Entregado por la empresa (fondo negro retirado) | clara |
| `msp.png` | Entregado por la empresa (fondo negro retirado) | clara |
| `edimca.png` | edimca.com.ec | clara |
| `grupo-mega.png` | grupomega.ec | clara |
| `camal-quito.png` | rastro.quito.gob.ec (Empresa Pública Metropolitana de Rastro, logo blanco) | oscura |
| `camal-balsas.png` | balsas.gob.ec (logo del GAD Municipal, propietario del camal) | clara |

| `clinica-maternidad.png` | Entregado por la empresa (fondo blanco retirado) | clara |
| `hospital-universitario.png` | Recompuesto a partir del banner entregado: logo MSP + nombre | clara |

### Distintivos generados (no son logos oficiales)

Creados para este sitio porque el cliente no tiene logo publicado. En el código llevan `generatedBadge: true` y se
anuncian como «Distintivo de…», nunca como logo. **Reemplazarlos por el logo oficial cuando el cliente lo entregue**
(mismo nombre de archivo y quitar `generatedBadge`).

`distrito-24d01.png`, `distrito-20d01.png`, `incisdent.png`, `camal-pajan.png`, `piladora-pantaleon.png`,
`piladora-la-dorada.png`.

No se usan logos de campaña de autoridades ni el escudo nacional.
