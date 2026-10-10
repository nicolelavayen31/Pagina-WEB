# Fotografías de trabajos

- `originals/`: archivos originales sin modificar (respaldo; no se publican).
- `../../public/images/trabajos/`: copias optimizadas (WebP) que usa el sitio. Se referencian solo desde
  `src/lib/site-photos.ts`.

Las imágenes de **proyectos** no se guardan aquí: se suben desde el panel (Proyectos → Imágenes) y las sirve la API.

## Clasificación

| Original | Contenido visible | Clasificación | Estado | Optimizada |
|---|---|---|---|---|
| `sistema-neumatico.png` | Válvulas y reguladores neumáticos, tubería azul, estructura inoxidable | Servicio 1 · Sistemas neumáticos para camales | Segura | Sí |
| `medicion-tablero-electrico.png` | Fluke 287 (209,65 VAC) y pinza (49,3 A) en tablero de breakers | Servicio 2 · Estudio eléctrico | Segura | Sí |
| `tablero-quemador-frontal.png` | Tablero rotulado QUEMADOR_1, MARCHA/PARO, TT_1–TT_3 | Servicio 3 · Control de quemadores | Segura | Sí |
| `tablero-camaras-secado.png` | Controladores rotulados "Cámara de secado", grano al fondo | Servicio 4 · Testigos de temperatura | Segura | Sí |
| `tablero-camara-frigorifica.png` | Controladores y pilotos COMP / VENT / DEFR | Servicio 6 · Cámaras frigoríficas | Segura | Sí (sin la fecha impresa) |
| `indicadores-temperatura-a1-b4.png` | Indicadores °C rotulados A1–A4 / B1–B4 | Probable: servicio 4 | **Por confirmar** | No |
| `tablero-inox-selector-tension.png` | Tablero inoxidable con selector de tensión, LO/HI y medidor V/A/Hz | Probable: servicio 5 | **Por confirmar** | No |
| `medicion-pinza-tablero-contactores.png` | Pinza Truper midiendo en tablero con contactores | Probable: servicio 2 | **Por confirmar** | No |
| `tablero-control-interior.png` | Interior de tablero con SSR, contactor y protecciones | Probable: servicio 3 (mismo tablero que el frontal) | **Por confirmar** | Sí (no se usa) |
| `termografia-tablero.png` | Termografía de bornes (máx. 110 °C) | Probable: servicio 2 | **Por confirmar** | Sí (no se usa) |
| `plc-logo-reles.png` | PLC Siemens LOGO! con relés R1–R4 | Sin clasificar | **Por confirmar** | No |
| `estator-motor-rebobinado.png` | Estator de motor rebobinado | Fuera de los 6 servicios | **Por confirmar** | No |
| `consultorio-aire-acondicionado.png` | Consultorio odontológico con aire acondicionado split | Fuera de los 6 servicios | **Por confirmar** | No |
| `mantenimiento-equipo-cocina.png` | Gabinete de cocina Henny Penny HC-903 | Fuera de los 6 servicios | **Por confirmar** | Sí (no se usa) |

Retoque aplicado a las copias: balance de blancos parcial, brillo/contraste moderados, enfoque suave y
compresión WebP. Nunca se añaden ni se quitan elementos; la termografía conserva sus colores.
