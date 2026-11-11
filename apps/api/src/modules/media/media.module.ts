import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import type { EnvConfig } from '../../config/env.schema';
import { ImageProcessor } from './application/ports/image-processor';
import { ProjectImageRepository } from './application/ports/project-image.repository';
import { DeleteProjectImageUseCase } from './application/use-cases/delete-project-image.use-case';
import { GetImageForDeliveryUseCase } from './application/use-cases/get-image-for-delivery.use-case';
import { UploadProjectImageUseCase } from './application/use-cases/upload-project-image.use-case';
import { PrismaProjectImageRepository } from './infrastructure/prisma-project-image.repository';
import { SharpImageProcessor } from './infrastructure/sharp-image-processor';
import { MediaController } from './presentation/media.controller';

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
  providers: [
    { provide: ProjectImageRepository, useClass: PrismaProjectImageRepository },
    { provide: ImageProcessor, useClass: SharpImageProcessor },
    UploadProjectImageUseCase,
    DeleteProjectImageUseCase,
    GetImageForDeliveryUseCase,
  ],
})
export class MediaModule {}
