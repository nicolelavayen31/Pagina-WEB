import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '../../../common/application/pagination';
import { ProjectNotFoundError } from '../domain/project.errors';
import { ProjectReader } from './ports/project.reader';
import type { AdminProjectView, PublicProjectView } from './project.views';

@Injectable()
export class ProjectQueries {
  constructor(private readonly reader: ProjectReader) {}

  listPublished(request: PageRequest): Promise<Page<PublicProjectView>> {
    return this.reader.listPublished(request);
  }

  async getPublishedBySlug(slug: string): Promise<PublicProjectView> {
    return orNotFound(await this.reader.findPublishedBySlug(slug));
  }

  listAll(request: PageRequest): Promise<Page<AdminProjectView>> {
    return this.reader.listAll(request);
  }

  async getById(id: string): Promise<AdminProjectView> {
    return orNotFound(await this.reader.findById(id));
  }
}

function orNotFound<T>(value: T | null): T {
  if (!value) {
    throw new ProjectNotFoundError();
  }
  return value;
}
