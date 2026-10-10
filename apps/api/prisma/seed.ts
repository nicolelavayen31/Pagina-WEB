import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { syncRolesAndPermissions } from '../src/modules/auth/rbac-sync';

const prisma = new PrismaClient();

// Service catalogue. `update: {}` keeps any later edits made from the admin panel.
// Slugs must match SERVICE_PHOTOS in apps/web/src/lib/site-photos.ts.
const INITIAL_SERVICES = [
  {
    slug: 'sistemas-neumaticos-camales',
    name: 'Sistemas neumáticos para camales',
    summary: 'Circuitos neumáticos para el accionamiento de equipos de faenamiento.',
    description:
      'Diseño e instalación de circuitos neumáticos con válvulas, reguladores y líneas de aire para el accionamiento de equipos en plantas de faenamiento.',
  },
  {
    slug: 'estudio-electrico-anomalias-consumo',
    name: 'Estudio eléctrico para detección de anomalías de consumo',
    summary: 'Mediciones eléctricas para detectar consumos anómalos.',
    description:
      'Mediciones de tensión y corriente en tableros e instalaciones eléctricas para identificar consumos anómalos y puntos de mejora.',
  },
  {
    slug: 'control-quemadores-secadoras-arroz',
    name: 'Control de quemadores industriales con HMI para secadoras de arroz',
    summary: 'Tableros de control con HMI para quemadores de secadoras de arroz.',
    description:
      'Diseño y construcción de sistemas de control para quemadores industriales, con interfaz HMI para la operación de secadoras de arroz.',
  },
  {
    slug: 'testigos-temperatura-camaras-secado',
    name: 'Testigos de temperatura para cámaras de secado de granos',
    summary: 'Indicadores de temperatura para cámaras de secado de granos.',
    description:
      'Diseño y construcción de tableros con indicadores de temperatura para supervisar cada cámara de secado de granos.',
  },
  {
    slug: 'aturdidores-electricos-porcinos',
    name: 'Aturdidores eléctricos para ganado porcino',
    summary: 'Equipos de aturdimiento eléctrico para faenamiento porcino.',
    description: 'Diseño y construcción de aturdidores eléctricos para plantas de faenamiento de ganado porcino.',
  },
  {
    slug: 'tableros-camaras-frigorificas',
    name: 'Tableros de control y fuerza para cámaras frigoríficas',
    summary: 'Tableros de control y fuerza para cámaras frigoríficas.',
    description:
      'Diseño y construcción de tableros de control y fuerza para cámaras frigoríficas, con mando de compresor, ventilación y deshielo.',
  },
];

/**
 * First generic catalogue, replaced by INITIAL_SERVICES. These rows are deactivated, never
 * deleted: quote requests that reference them keep their service, and an admin can
 * re-enable any of them from the panel.
 */
const RETIRED_SERVICE_SLUGS = [
  'mantenimiento-integral',
  'remodelaciones',
  'construccion-obra-civil',
  'instalaciones-electricas',
  'plomeria-sanitarias',
  'pintura-acabados',
];
const CATALOGUE_V2_MARKER = 'seed.service_catalogue_v2';

async function seedServices() {
  for (const [index, service] of INITIAL_SERVICES.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: { ...service, sortOrder: index * 10 },
    });
  }
  console.log(`Services ensured: ${INITIAL_SERVICES.length}`);

  // Retire the generic catalogue only once, so a later manual re-activation survives re-seeding.
  const alreadyApplied = await prisma.auditLog.findFirst({ where: { action: CATALOGUE_V2_MARKER } });
  if (alreadyApplied) {
    console.log('Generic catalogue already retired earlier: left as is.');
    return;
  }
  const retired = await prisma.service.updateMany({
    where: { slug: { in: RETIRED_SERVICE_SLUGS }, isActive: true },
    data: { isActive: false },
  });
  await prisma.auditLog.create({
    data: {
      action: CATALOGUE_V2_MARKER,
      entityType: 'Service',
      entityId: 'catalogue',
      metadata: { deactivated: retired.count, slugs: RETIRED_SERVICE_SLUGS },
    },
  });
  console.log(`Generic services deactivated (not deleted): ${retired.count}`);
}

/**
 * Creates the first administrator only if it does not exist.
 * An existing account keeps its password; only the ADMIN role is ensured.
 */
async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || 'Administrador';

  if (!email || !password) {
    console.warn('Admin bootstrap skipped: ADMIN_EMAIL and ADMIN_PASSWORD are not set.');
    return;
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  let user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

  if (!user) {
    if (password.length < 12) {
      throw new Error('ADMIN_PASSWORD must be at least 12 characters long.');
    }
    user = await prisma.user.create({
      data: { email, name, passwordHash: await argon2.hash(password, { type: argon2.argon2id }) },
    });
    console.log('Administrator created.');
  } else {
    console.log('Administrator already exists: password left unchanged.');
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });
}

async function main() {
  await syncRolesAndPermissions(prisma);
  console.log('Roles and permissions synchronised.');
  await seedServices();
  await bootstrapAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
