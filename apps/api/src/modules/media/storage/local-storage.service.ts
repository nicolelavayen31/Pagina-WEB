import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import * as path from 'path';
import type { EnvConfig } from '@repo/contracts';
import { STORAGE_KEY_PATTERN, StorageService } from './storage.service';

@Injectable()
export class LocalStorageService extends StorageService {
  private readonly root: string;

  constructor(config: ConfigService<EnvConfig, true>) {
    super();
    this.root = path.resolve(config.get('UPLOAD_DIR', { infer: true }));
  }

  async put(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    // 'wx' refuses to overwrite an existing file.
    await writeFile(filePath, data, { flag: 'wx', mode: 0o640 });
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  private resolve(key: string): string {
    if (!STORAGE_KEY_PATTERN.test(key)) {
      throw new Error('Invalid storage key');
    }
    const filePath = path.resolve(this.root, key);
    if (!filePath.startsWith(this.root + path.sep)) {
      throw new Error('Storage key escapes the upload directory');
    }
    return filePath;
  }
}
