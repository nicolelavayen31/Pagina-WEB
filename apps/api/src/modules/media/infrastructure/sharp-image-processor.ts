import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import type { ImageProcessor, ProcessedImage } from '../application/ports/image-processor';
import { CorruptImageError } from '../domain/media.errors';

const MAX_DIMENSION = 2400;
const MAX_INPUT_PIXELS = 40_000_000;
const WEBP_QUALITY = 82;

@Injectable()
export class SharpImageProcessor implements ImageProcessor {
  async process(input: Buffer): Promise<ProcessedImage> {
    try {
      const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer({ resolveWithObject: true });
      return { data, width: info.width, height: info.height };
    } catch {
      throw new CorruptImageError();
    }
  }
}
