/**
 * Clients the company has worked with, shown on the home page ("Han confiado en nosotros").
 * Logos live in public/images/clientes (see the README there), used with each client's
 * authorisation. Without `logo`, the card shows the client's initials.
 */
export type ClientSector = 'Salud' | 'Sector público' | 'Educación' | 'Industria y comercio' | 'Agroindustria';

export type Client = {
  id: string;
  name: string;
  /** Short label for the monogram card when there is no logo. */
  initials: string;
  sector: ClientSector;
  place?: string;
  /** PNG file name inside public/images/clientes. */
  logo?: string;
  /** 'dark' for white logos that need a navy plate behind them. */
  logoPlate?: 'light' | 'dark';
  /**
   * True when the image is a name badge made for this site (no official logo was available).
   * It is announced as a badge, never as the client's logo; replace it when the client sends theirs.
   */
  generatedBadge?: boolean;
};

export const CLIENT_LOGO_DIR = '/images/clientes';

export const CLIENTS: Client[] = [
  {
    id: 'ucsg',
    name: 'Universidad Católica de Santiago de Guayaquil',
    initials: 'UCSG',
    sector: 'Educación',
    place: 'Guayaquil',
    logo: 'ucsg-logo.png',
  },
  { id: 'msp', name: 'Ministerio de Salud Pública', initials: 'MSP', sector: 'Sector público', logo: 'msp.png' },
  {
    id: 'distrito-24d01',
    name: 'Dirección Distrital 24D01',
    initials: '24D01',
    sector: 'Sector público',
    place: 'Santa Elena',
    logo: 'distrito-24d01.png',
    generatedBadge: true,
  },
  {
    id: 'distrito-20d01',
    name: 'Dirección Distrital 20D01',
    initials: '20D01',
    sector: 'Sector público',
    place: 'San Cristóbal y Santa Cruz, Galápagos',
    logo: 'distrito-20d01.png',
    generatedBadge: true,
  },
  {
    id: 'hospital-universitario',
    name: 'Hospital Universitario',
    initials: 'HU',
    sector: 'Salud',
    logo: 'hospital-universitario.png',
  },
  {
    id: 'maternidad-marianita',
    name: 'Clínica Maternidad Marianita de Jesús',
    initials: 'MJ',
    sector: 'Salud',
    logo: 'clinica-maternidad.png',
  },
  {
    id: 'edimca',
    name: 'EDIMCA · Durini Industria de Madera C.A.',
    initials: 'ED',
    sector: 'Industria y comercio',
    logo: 'edimca.png',
  },
  { id: 'grupo-mega', name: 'Grupo Mega', initials: 'GM', sector: 'Industria y comercio', logo: 'grupo-mega.png' },
  { id: 'incisdent', name: 'Incisdent', initials: 'IN', sector: 'Salud', logo: 'incisdent.png', generatedBadge: true },
  {
    id: 'camal-quito',
    name: 'Camal de Quito',
    initials: 'CQ',
    sector: 'Agroindustria',
    place: 'Quito',
    logo: 'camal-quito.png',
    logoPlate: 'dark',
  },
  {
    id: 'camal-pajan',
    name: 'Camal de Paján',
    initials: 'CP',
    sector: 'Agroindustria',
    place: 'Paján',
    logo: 'camal-pajan.png',
    generatedBadge: true,
  },
  {
    id: 'camal-balsas',
    name: 'Camal de Balsas',
    initials: 'CB',
    sector: 'Agroindustria',
    place: 'Balsas',
    logo: 'camal-balsas.png',
  },
  {
    id: 'piladora-pantaleon',
    name: 'Piladora Pantaleón',
    initials: 'PP',
    sector: 'Agroindustria',
    place: 'Colimes',
    logo: 'piladora-pantaleon.png',
    generatedBadge: true,
  },
  {
    id: 'piladora-la-dorada',
    name: 'Piladora La Dorada',
    initials: 'LD',
    sector: 'Agroindustria',
    place: 'Limonal',
    logo: 'piladora-la-dorada.png',
    generatedBadge: true,
  },
];

/** Highlights shown next to the client wall. */
export const CLIENT_HIGHLIGHTS = [
  {
    title: 'Establecimientos de salud particulares',
    text: 'Atención a clínicas y centros de salud privados a nivel nacional.',
  },
  {
    title: 'Edificio de 20 pisos en Ciudad Colón',
    text: 'Sistema eléctrico completo del edificio.',
  },
];
