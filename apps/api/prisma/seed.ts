import * as argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { syncRolesAndPermissions } from '../src/modules/auth/rbac-sync';

const prisma = new PrismaClient();

// Initial catalogue. `update: {}` keeps any later edits made from the admin panel.
const INITIAL_SERVICES = [
  {
    slug: 'mantenimiento-integral',
    name: 'Mantenimiento integral de edificios',
    summary: 'Mantenimiento preventivo y correctivo para edificios, oficinas y locales comerciales.',
    description:
      'Planes de mantenimiento preventivo y correctivo: revisión periódica de instalaciones, reparaciones, cubiertas, fachadas y áreas comunes.',
  },
  {
    slug: 'remodelaciones',
    name: 'Remodelaciones y adecuaciones',
    summary: 'Renovación de espacios residenciales, comerciales y corporativos.',
    description:
      'Rediseño y adecuación de espacios: demoliciones controladas, tabiquería, cielos rasos, pisos y acabados, coordinando todo el proceso de obra.',
  },
  {
    slug: 'construccion-obra-civil',
    name: 'Construcción y obra civil',
    summary: 'Ejecución de obra nueva y ampliaciones con control técnico y presupuestario.',
    description:
      'Construcción de obra nueva y ampliaciones: planificación, cimentación, estructura, mampostería y dirección técnica con seguimiento de costos y plazos.',
  },
  {
    slug: 'instalaciones-electricas',
    name: 'Instalaciones eléctricas',
    summary: 'Diseño, instalación y mantenimiento de sistemas eléctricos.',
    description:
      'Instalaciones eléctricas nuevas, ampliaciones, tableros, iluminación y mantenimiento correctivo conforme a la normativa vigente.',
  },
  {
    slug: 'plomeria-sanitarias',
    name: 'Plomería e instalaciones sanitarias',
    summary: 'Redes de agua potable, desagües y reparación de fugas.',
    description:
      'Instalación y reparación de redes de agua potable y sanitarias, detección y reparación de fugas, y mantenimiento de equipos de bombeo.',
  },
  {
    slug: 'pintura-acabados',
    name: 'Pintura y acabados',
    summary: 'Pintura interior y exterior, impermeabilización y acabados.',
    description:
      'Preparación de superficies, pintura interior y exterior, impermeabilización de cubiertas y acabados decorativos para todo tipo de inmuebles.',
  },
];

async function seedServices() {
  for (const [index, service] of INITIAL_SERVICES.entries()) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: { ...service, sortOrder: index * 10 },
    });
  }
  console.log(`Services ensured: ${INITIAL_SERVICES.length}`);
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
