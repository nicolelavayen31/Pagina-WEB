import { NotFoundError, UnsupportedContentError } from '../../../common/domain/domain-error';

/** Also used for images the requester may not see, so their existence is not revealed. */
export class ImageNotFoundError extends NotFoundError {
  constructor() {
    super('Imagen no encontrada');
  }
}

export class UnsupportedImageFormatError extends UnsupportedContentError {
  constructor() {
    super('Formato no permitido. Use JPEG, PNG o WebP.');
  }
}

export class CorruptImageError extends UnsupportedContentError {
  constructor() {
    super('La imagen está dañada o no es válida.');
  }
}
