/**
 * Real job photos in public/images/servicios (optimised copies; originals live in
 * apps/web/assets/photos/originals). Change the mapping here only.
 */
export type SitePhoto = { src: string; alt: string; position?: string };

export const HERO_PHOTO: SitePhoto = {
  src: '/images/servicios/medicion-tablero-electrico.webp',
  alt: 'Técnico midiendo tensión en un tablero eléctrico con multímetro y pinza amperimétrica',
  position: 'center 55%',
};

/** Keyed by service slug. The first photo is used on the card; the rest are extra material for that service. */
export const SERVICE_PHOTOS: Record<string, SitePhoto[]> = {
  'mantenimiento-integral': [
    {
      src: '/images/servicios/mantenimiento-equipo-cocina.webp',
      alt: 'Gabinete de mantenimiento de temperatura para cocina comercial en funcionamiento',
      position: 'center 40%',
    },
  ],
  'instalaciones-electricas': [
    {
      src: '/images/servicios/tablero-control-cableado.webp',
      alt: 'Tablero de control abierto con protecciones, contactores y cableado ordenado',
      position: 'center',
    },
    {
      src: '/images/servicios/tablero-control-frontal.webp',
      alt: 'Tablero de control instalado con pulsadores, pilotos e indicadores rotulados',
      position: 'center 35%',
    },
  ],
};
