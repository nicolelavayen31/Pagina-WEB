import { Injectable } from '@nestjs/common';
import { ServiceNotFoundError } from '../domain/service.errors';
import { ServiceRepository, type PublicServiceView, type ServiceView } from './ports/service.repository';

/** Read side of the service catalogue; also used by the leads module to validate a selected service. */
@Injectable()
export class ServiceQueries {
  constructor(private readonly services: ServiceRepository) {}

  listActive(): Promise<PublicServiceView[]> {
    return this.services.listActive();
  }

  async getActiveBySlug(slug: string): Promise<PublicServiceView> {
    const service = await this.services.findActiveBySlug(slug);
    if (!service) {
      throw new ServiceNotFoundError();
    }
    return service;
  }

  isActive(id: string): Promise<boolean> {
    return this.services.isActive(id);
  }

  listAll(): Promise<ServiceView[]> {
    return this.services.listAll();
  }
}
