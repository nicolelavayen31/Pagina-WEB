/**
 * Business errors raised by the domain and application layers. They carry no HTTP details:
 * the presentation layer (`AllExceptionsFilter`) translates each kind into a status code.
 */
export type DomainErrorKind = 'not_found' | 'conflict' | 'invalid' | 'unsupported' | 'unauthenticated' | 'unavailable';

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends DomainError {
  readonly kind = 'not_found';
}

export class ConflictError extends DomainError {
  readonly kind = 'conflict';
}

/** The request is well formed but breaks a business rule. */
export class InvalidOperationError extends DomainError {
  readonly kind = 'invalid';
}

export class UnsupportedContentError extends DomainError {
  readonly kind = 'unsupported';
}

export class UnauthenticatedError extends DomainError {
  readonly kind = 'unauthenticated';
}

/** A dependency the operation needs (e.g. an external verification service) is temporarily unavailable. */
export class DependencyUnavailableError extends DomainError {
  readonly kind = 'unavailable';
}
