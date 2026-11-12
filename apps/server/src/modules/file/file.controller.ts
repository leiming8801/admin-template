import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { FileRecord } from '@admin-template/shared';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { FileService } from './file.service';
import { UploadedFileInput } from './file.types';

@Controller('admin/files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { files: 1, fileSize: 10 * 1024 * 1024 } }))
  async upload(
    @UploadedFile() file: UploadedFileInput | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<FileRecord> {
    const record = await this.fileService.upload(file, { type: 'admin', id: user.sub });
    return this.fileService.toRecord(record);
  }

  @Get(':id/content')
  @SkipTransform()
  async download(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { record, stream } = await this.fileService.openOwnedFile(id, {
      type: 'admin',
      id: user.sub,
    });
    response.set({
      'Content-Type': record.mimeType,
      'Content-Length': record.size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.originalName)}`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(stream);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<null> {
    await this.fileService.removeOwnedFile(id, { type: 'admin', id: user.sub });
    return null;
  }
}
