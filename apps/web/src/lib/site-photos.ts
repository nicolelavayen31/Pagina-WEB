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
 * Projects page gallery. Texts describe only what is visible in each photo: no client,
 * location or date is stated because none is documented. Add pending photos here once
 * their classification is confirmed (see apps/web/assets/photos/README.md).
 */
export type WorkItem = {
  id: string;
  photo: SitePhoto;
  title: string;
  category: string;
  summary: string;
  details: string[];
};

export const WORK_GALLERY: WorkItem[] = [
  {
    id: 'sistema-neumatico-camal',
    photo: PHOTOS.pneumatic,
    title: 'Sistema neumático para camal',
    category: 'Neumática',
    summary: 'Montaje de válvulas y reguladores de presión con líneas de aire sobre estructura de acero inoxidable.',
    details: [
      'Válvula de mando y reguladores de presión con manómetro',
      'Tubería neumática con conexiones rápidas y codos',
      'Montaje sobre estructura de acero inoxidable',
    ],
  },
  {
    id: 'tablero-control-quemador',
    photo: PHOTOS.burnerPanel,
    title: 'Tablero de control de quemador',
    category: 'Automatización',
    summary: 'Tablero de mando para quemador y extractor con señalización, paro de emergencia y controladores.',
    details: [
      'Pilotos de falla térmica y presencia de 220 V',
      'Paro de emergencia, pulsadores de marcha y paro',
      'Controladores C1 y C2 con indicadores de temperatura TT_1 a TT_3',
    ],
  },
  {
    id: 'testigos-camaras-secado',
    photo: PHOTOS.dryingChambers,
    title: 'Testigos de temperatura de cámaras de secado',
    category: 'Control de temperatura',
    summary: 'Tablero con un controlador de temperatura por cámara de secado, selectores y pilotos de señalización.',
    details: [
      'Controladores de temperatura rotulados por cámara de secado',
      'Selector y piloto de señalización por cámara',
      'Seccionador general en la puerta del tablero',
    ],
  },
  {
    id: 'medicion-tablero-distribucion',
    photo: PHOTOS.electricalMeasurement,
    title: 'Medición eléctrica en tablero de distribución',
    category: 'Estudio eléctrico',
    summary: 'Medición de tensión y corriente en un tablero de distribución para el análisis del consumo.',
    details: [
      'Multímetro Fluke 287 con lectura de 209,65 VAC',
      'Pinza amperimétrica Fluke 376 con sonda flexible (lectura 49,3)',
      'Medición realizada sobre el tablero de breakers en servicio',
    ],
  },
  {
    id: 'tablero-camara-frigorifica',
    photo: PHOTOS.coldRoom,
    title: 'Tablero de control para cámara frigorífica',
    category: 'Refrigeración',
    summary: 'Tablero para dos circuitos de refrigeración con controladores de temperatura y señalización de cada etapa.',
    details: [
      'Dos controladores digitales de temperatura',
      'Pilotos de compresor, ventilación y deshielo por circuito',
      'Selector de encendido independiente para cada circuito',
    ],
  },
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
