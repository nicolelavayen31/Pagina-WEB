import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { ServiceRepository, type ServiceDetails, type ServiceView } from '../ports/service.repository';

@Injectable()
export class CreateServiceUseCase {
  constructor(
    private readonly services: ServiceRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(details: ServiceDetails, actorId: string): Promise<ServiceView> {
    const service = await this.services.create(details);
    await this.audit.log({ actorId, action: 'service.created', entityType: 'Service', entityId: service.id });
    return service;
  }
}
