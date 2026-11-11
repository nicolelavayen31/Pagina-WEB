export type PublicServiceView = { id: string; name: string; slug: string; summary: string; description: string };

export type ServiceView = PublicServiceView & { isActive: boolean; sortOrder: number; createdAt: Date; updatedAt: Date };

export type ServiceDetails = Omit<PublicServiceView, 'id'> & { isActive: boolean; sortOrder: number };

export abstract class ServiceRepository {
  /** Active services only, in display order. */
  abstract listActive(): Promise<PublicServiceView[]>;
  abstract findActiveBySlug(slug: string): Promise<PublicServiceView | null>;
  abstract isActive(id: string): Promise<boolean>;
  abstract listAll(): Promise<ServiceView[]>;
  abstract exists(id: string): Promise<boolean>;
  abstract create(details: ServiceDetails): Promise<ServiceView>;
  abstract update(id: string, changes: Partial<ServiceDetails>): Promise<ServiceView>;
}
