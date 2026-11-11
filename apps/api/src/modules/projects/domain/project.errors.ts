import { ConflictError, InvalidOperationError, NotFoundError } from '../../../common/domain/domain-error';

export class ProjectNotFoundError extends NotFoundError {
  constructor() {
    super('Proyecto no encontrado');
  }
}

export class ProjectAlreadyPublishedError extends ConflictError {
  constructor() {
    super('El proyecto ya está publicado');
  }
}

export class ProjectNotPublishedError extends ConflictError {
  constructor() {
    super('Solo se pueden despublicar proyectos publicados');
  }
}

export class ProjectAlreadyArchivedError extends ConflictError {
  constructor() {
    super('El proyecto ya está archivado');
  }
}

export class CoverImageNotInProjectError extends InvalidOperationError {
  constructor() {
    super('La portada debe ser una imagen del proyecto');
  }
}

export class InvalidProjectAuthorError extends InvalidOperationError {
  constructor() {
    super('El autor indicado no existe o está inactivo');
  }
}
