import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { FileService } from './file.service';
import { FileOwnerType } from './file.types';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';

@Public()
@Controller('file-assets/avatars')
export class FileAssetController {
  constructor(private readonly fileService: FileService) {}

  @Get(':ownerType/:ownerId/:filename')
  @SkipTransform()
  async getAvatar(
    @Param('ownerType') ownerType: string,
    @Param('ownerId', ParseIntPipe) ownerId: number,
    @Param('filename') filename: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    if (ownerType !== 'admin' && ownerType !== 'member') {
      throw new NotFoundException('file.notFound');
    }
    const { stream, size, mimeType } = await this.fileService.openAvatar(
      ownerType as FileOwnerType,
      ownerId,
      filename,
    );
    response.set({
      'Content-Type': mimeType,
      'Content-Length': size,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(stream);
  }
}
