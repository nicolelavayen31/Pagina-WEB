import { detectImageType } from '../../src/modules/media/image-validation';

describe('detectImageType', () => {
  it('detects JPEG, PNG and WebP by signature', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(detectImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('image/png');
    expect(detectImageType(Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'binary'))).toBe('image/webp');
  });

  it('rejects executables, SVG and HTML regardless of extension', () => {
    expect(detectImageType(Buffer.from('MZ\x90\x00\x03\x00', 'binary'))).toBeNull();
    expect(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
    expect(detectImageType(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});
