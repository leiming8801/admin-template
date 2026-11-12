import { Module } from '@nestjs/common';
import { FileAssetController } from './file-asset.controller';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { LocalFileStorageService } from './local-file-storage.service';

@Module({
  controllers: [FileController, FileAssetController],
  providers: [FileService, LocalFileStorageService],
  exports: [FileService],
})
export class FileModule {}
