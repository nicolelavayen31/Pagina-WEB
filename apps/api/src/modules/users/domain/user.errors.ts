import { InvalidOperationError, NotFoundError } from '../../../common/domain/domain-error';

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('Usuario no encontrado');
  }
}

export class SelfLockoutError extends InvalidOperationError {
  constructor() {
    super('No puede desactivarse ni quitarse el rol ADMIN a sí mismo');
  }
}

export class UnknownRoleError extends InvalidOperationError {
  constructor() {
    super('Rol desconocido');
  }
}
