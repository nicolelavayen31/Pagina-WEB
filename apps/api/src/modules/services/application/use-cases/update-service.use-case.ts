import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../audit/application/audit-logger';
import { ServiceNotFoundError } from '../../domain/service.errors';
import { ServiceRepository, type ServiceDetails, type ServiceView } from '../ports/service.repository';

@Injectable()
export class UpdateServiceUseCase {
  constructor(
    private readonly services: ServiceRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(id: string, changes: Partial<ServiceDetails>, actorId: string): Promise<ServiceView> {
    if (!(await this.services.exists(id))) {
      throw new ServiceNotFoundError();
    }
    const service = await this.services.update(id, changes);
    await this.audit.log({
      actorId,
      action: 'service.updated',
      entityType: 'Service',
      entityId: id,
      metadata: { fields: Object.keys(changes) },
    });
    return service;
  }
}
