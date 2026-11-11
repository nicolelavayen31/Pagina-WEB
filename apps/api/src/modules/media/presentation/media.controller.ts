import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { projectImageMetaSchema } from '@repo/contracts';
import type { z } from 'zod';
import { ZodValidationPipe } from '../../../common/presentation/zod-validation.pipe';
import type { SessionUser } from '../../auth/presentation/authenticated-request';
import { CurrentUser } from '../../auth/presentation/current-user.decorator';
import { RequirePermissions } from '../../auth/presentation/require-permissions.decorator';
import { SESSION_COOKIE } from '../../auth/presentation/session-cookie';
import { DeleteProjectImageUseCase } from '../application/use-cases/delete-project-image.use-case';
import { GetImageForDeliveryUseCase } from '../application/use-cases/get-image-for-delivery.use-case';
import { UploadProjectImageUseCase } from '../application/use-cases/upload-project-image.use-case';
import { STORED_IMAGE_TYPE } from '../domain/project-image';

const uuidPipe = new ParseUUIDPipe();

@Controller()
export class MediaController {
  constructor(
    private readonly uploadImage: UploadProjectImageUseCase,
    private readonly deleteImage: DeleteProjectImageUseCase,
    private readonly getImage: GetImageForDeliveryUseCase,
  ) {}

  @RequirePermissions('media:upload')
  @Post('admin/projects/:id/images')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('id', uuidPipe) projectId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body(new ZodValidationPipe(projectImageMetaSchema)) meta: z.infer<typeof projectImageMetaSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    if (!file || file.size === 0) {
      throw new BadRequestException({ statusCode: 400, message: 'Debe adjuntar una imagen en el campo "file"' });
    }
    return this.uploadImage.execute({ projectId, file: file.buffer, ...meta }, user.id);
  }

  @RequirePermissions('media:delete')
  @Delete('admin/projects/:id/images/:imageId')
  remove(
    @Param('id', uuidPipe) projectId: string,
    @Param('imageId', uuidPipe) imageId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.deleteImage.execute(projectId, imageId, user.id);
  }

  @SkipThrottle()
  @Get('media/:imageId')
  async deliver(@Param('imageId', uuidPipe) imageId: string, @Req() req: Request, @Res() res: Response) {
    const { data, isPublic } = await this.getImage.execute(imageId, req.cookies?.[SESSION_COOKIE]);
    res.setHeader('Content-Type', STORED_IMAGE_TYPE);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', isPublic ? 'public, max-age=3600' : 'private, no-store');
    res.send(data);
  }
}
