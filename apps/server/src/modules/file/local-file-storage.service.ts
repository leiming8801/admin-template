import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream, ReadStream } from 'fs';
import { mkdir, stat, unlink, writeFile } from 'fs/promises';
import { dirname, resolve, sep } from 'path';

@Injectable()
export class LocalFileStorageService {
  private readonly rootPath = resolve(__dirname, '../../../storage/uploads');

  async save(objectKey: string, buffer: Buffer): Promise<void> {
    const filePath = this.resolvePath(objectKey);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer, { flag: 'wx' });
  }

  async open(objectKey: string): Promise<{ stream: ReadStream; size: number }> {
    const filePath = this.resolvePath(objectKey);
    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        throw new NotFoundException('file.notFound');
      }
      return { stream: createReadStream(filePath), size: fileStat.size };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new NotFoundException('file.notFound');
      }
      throw error;
    }
  }

  async delete(objectKey: string): Promise<void> {
    try {
      await unlink(this.resolvePath(objectKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private resolvePath(objectKey: string): string {
    const filePath = resolve(this.rootPath, objectKey);
    if (!filePath.startsWith(`${this.rootPath}${sep}`)) {
      throw new NotFoundException('file.notFound');
    }
    return filePath;
  }
}
