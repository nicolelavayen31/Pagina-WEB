import type { PrismaPromise } from '@prisma/client';
import type { Page, PageRequest } from '../application/pagination';
import type { PrismaService } from './prisma.service';

/** Runs the page query and the total count in one transaction so both see the same snapshot. */
export async function paginate<T>(
  prisma: PrismaService,
  request: PageRequest,
  findPage: (window: { skip: number; take: number }) => PrismaPromise<T[]>,
  count: () => PrismaPromise<number>,
): Promise<Page<T>> {
  const { page, pageSize } = request;
  const [items, total] = await prisma.$transaction([
    findPage({ skip: (page - 1) * pageSize, take: pageSize }),
    count(),
  ]);
  return { items, total, page, pageSize };
}
