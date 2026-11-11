export type ProcessedImage = { data: Buffer; width: number; height: number };

/**
 * Re-encodes an image to the stored format. Must drop EXIF/GPS metadata and anything that is
 * not pixel data, and throw `CorruptImageError` for undecodable input.
 */
export abstract class ImageProcessor {
  abstract process(input: Buffer): Promise<ProcessedImage>;
}
