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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { SessionUser } from '../../common/http/authenticated-request';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SESSION_COOKIE } from '../auth/session.constants';
import { MediaService } from './media.service';

@Controller()
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @RequirePermissions('media:upload')
  @Post('admin/projects/:id/images')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body(new ZodValidationPipe(projectImageMetaSchema)) meta: z.infer<typeof projectImageMetaSchema>,
    @CurrentUser() user: SessionUser,
  ) {
    if (!file || file.size === 0) {
      throw new BadRequestException({ statusCode: 400, message: 'Debe adjuntar una imagen en el campo "file"' });
    }
    return this.media.upload(projectId, file.buffer, meta, user.id);
  }

  @RequirePermissions('media:delete')
  @Delete('admin/projects/:id/images/:imageId')
  remove(
    @Param('id', new ParseUUIDPipe()) projectId: string,
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @CurrentUser() user: SessionUser,
  ) {
    return this.media.remove(projectId, imageId, user.id);
  }

  @SkipThrottle()
  @Get('media/:imageId')
  async deliver(
    @Param('imageId', new ParseUUIDPipe()) imageId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { data, isPublic } = await this.media.getForDelivery(imageId, req.cookies?.[SESSION_COOKIE]);
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', isPublic ? 'public, max-age=3600' : 'private, no-store');
    res.send(data);
  }
}
