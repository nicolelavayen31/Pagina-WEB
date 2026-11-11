import type { Page, PageRequest } from '../../../../common/application/pagination';
import type { AdminProjectView, PublicProjectView } from '../project.views';

/** Read side: returns ready-made views, so the public projection lives in a single place. */
export abstract class ProjectReader {
  abstract listPublished(request: PageRequest): Promise<Page<PublicProjectView>>;
  abstract findPublishedBySlug(slug: string): Promise<PublicProjectView | null>;
  abstract listAll(request: PageRequest): Promise<Page<AdminProjectView>>;
  abstract findById(id: string): Promise<AdminProjectView | null>;
}
