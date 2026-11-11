import {
  DependencyUnavailableError,
  InvalidOperationError,
  NotFoundError,
} from '../../../common/domain/domain-error';

export class LeadNotFoundError extends NotFoundError {
  constructor() {
    super('Solicitud no encontrada');
  }
}

export class UnknownServiceError extends InvalidOperationError {
  constructor() {
    super('El servicio seleccionado no existe');
  }
}

export class HumanVerificationRequiredError extends InvalidOperationError {
  constructor() {
    super('Verificación antispam requerida');
  }
}

export class HumanVerificationFailedError extends InvalidOperationError {
  constructor() {
    super('Verificación antispam fallida');
  }
}

export class HumanVerificationUnavailableError extends DependencyUnavailableError {
  constructor() {
    super('No se pudo verificar la solicitud. Inténtelo más tarde.');
  }
}
