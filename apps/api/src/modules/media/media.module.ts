import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import type { EnvConfig } from '@repo/contracts';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { LocalStorageService } from './storage/local-storage.service';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      // No `dest`/`storage`: multer keeps the file in memory so it is validated before touching disk.
      useFactory: (config: ConfigService<EnvConfig, true>) => ({
        limits: {
          fileSize: config.get('UPLOAD_MAX_BYTES', { infer: true }),
          files: 1,
          fields: 5,
          parts: 7,
        },
      }),
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, { provide: StorageService, useClass: LocalStorageService }],
  exports: [StorageService],
})
export class MediaModule {}
