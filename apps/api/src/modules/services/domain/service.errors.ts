import { NotFoundError } from '../../../common/domain/domain-error';

export class ServiceNotFoundError extends NotFoundError {
  constructor() {
    super('Servicio no encontrado');
  }
}
