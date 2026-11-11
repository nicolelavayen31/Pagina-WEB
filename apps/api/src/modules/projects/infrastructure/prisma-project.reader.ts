import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../common/application/pagination';
import { paginate } from '../../../common/persistence/paginate';
import { PrismaService } from '../../../common/persistence/prisma.service';
import type { ProjectReader } from '../application/ports/project.reader';
import type { AdminProjectView, PublicProjectView } from '../application/project.views';
import { adminProjectInclude, publicProjectSelect, publishedProjects } from './project.prisma-queries';

@Injectable()
export class PrismaProjectReader implements ProjectReader {
  constructor(private readonly prisma: PrismaService) {}

  listPublished(request: PageRequest): Promise<Page<PublicProjectView>> {
    return paginate(
      this.prisma,
      request,
      (window) =>
        this.prisma.project.findMany({
          ...window,
          where: publishedProjects,
          select: publicProjectSelect,
          orderBy: { publishedAt: 'desc' },
        }),
      () => this.prisma.project.count({ where: publishedProjects }),
    );
  }

  findPublishedBySlug(slug: string): Promise<PublicProjectView | null> {
    return this.prisma.project.findFirst({ where: { ...publishedProjects, slug }, select: publicProjectSelect });
  }

  listAll(request: PageRequest): Promise<Page<AdminProjectView>> {
    return paginate(
      this.prisma,
      request,
      (window) => this.prisma.project.findMany({ ...window, orderBy: { updatedAt: 'desc' }, include: adminProjectInclude }),
      () => this.prisma.project.count(),
    );
  }

  findById(id: string): Promise<AdminProjectView | null> {
    return this.prisma.project.findUnique({ where: { id }, include: adminProjectInclude });
  }
}
