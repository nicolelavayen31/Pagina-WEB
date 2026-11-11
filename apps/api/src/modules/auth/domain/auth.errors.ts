import { UnauthenticatedError } from '../../../common/domain/domain-error';

/** Same message for unknown, inactive and wrong-password accounts, so it reveals nothing. */
export class InvalidCredentialsError extends UnauthenticatedError {
  constructor() {
    super('Credenciales inválidas');
  }
}
