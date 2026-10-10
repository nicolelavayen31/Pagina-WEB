/**
 * Real job photos (optimised copies in public/images/trabajos; originals and their
 * classification status in apps/web/assets/photos). Only photos with a confirmed
 * classification are referenced here.
 */
export type SitePhoto = { src: string; alt: string; position?: string };
export type GallerySlide = SitePhoto & { caption: string };

const DIR = '/images/trabajos';

export const PHOTOS = {
  pneumatic: {
    src: `${DIR}/sistema-neumatico.webp`,
    alt: 'Válvulas y reguladores neumáticos con tubería azul montados en una estructura de acero inoxidable',
    position: 'center 45%',
  },
  burnerPanel: {
    src: `${DIR}/tablero-quemador-frontal.webp`,
    alt: 'Tablero de control de quemador con pulsadores de marcha y paro, controladores e indicadores de temperatura',
    position: 'center 38%',
  },
  dryingChambers: {
    src: `${DIR}/tablero-camaras-secado.webp`,
    alt: 'Tablero con controladores de temperatura para varias cámaras de secado de granos',
    position: 'center 32%',
  },
  electricalMeasurement: {
    src: `${DIR}/medicion-tablero-electrico.webp`,
    alt: 'Medición de tensión y corriente en un tablero eléctrico con multímetro y pinza amperimétrica',
    position: 'center 52%',
  },
  coldRoom: {
    src: `${DIR}/tablero-camara-frigorifica.webp`,
    alt: 'Tablero de cámara frigorífica con controladores y pilotos de compresor, ventilación y deshielo',
    position: 'center 40%',
  },
} satisfies Record<string, SitePhoto>;

/** Home page carousel. */
export const HERO_SLIDES: GallerySlide[] = [
  { ...PHOTOS.pneumatic, caption: 'Sistema neumático para camal' },
  { ...PHOTOS.burnerPanel, caption: 'Tablero de control de quemador' },
  { ...PHOTOS.dryingChambers, caption: 'Testigos de temperatura de cámaras de secado' },
  { ...PHOTOS.electricalMeasurement, caption: 'Medición eléctrica en tablero de distribución' },
  { ...PHOTOS.coldRoom, caption: 'Tablero de control para cámara frigorífica' },
];

/**
 * Keyed by service slug. Prepared for the new service catalogue (pending approval of the
 * seed change); services without an entry keep the striped navy background.
 */
export const SERVICE_PHOTOS: Record<string, SitePhoto[]> = {
  'sistemas-neumaticos-camales': [PHOTOS.pneumatic],
  'estudio-electrico-anomalias-consumo': [PHOTOS.electricalMeasurement],
  'control-quemadores-secadoras-arroz': [PHOTOS.burnerPanel],
  'testigos-temperatura-camaras-secado': [PHOTOS.dryingChambers],
  'tableros-camaras-frigorificas': [PHOTOS.coldRoom],
};
