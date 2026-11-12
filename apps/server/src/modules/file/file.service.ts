import { randomUUID } from 'crypto';
import { basename, extname } from 'path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { FileObject } from '@prisma/client';
import type { FileRecord } from '@admin-template/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { LocalFileStorageService } from './local-file-storage.service';
import { FileOwner, FileOwnerType, FilePurpose, UploadedFileInput } from './file.types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const FILE_MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.zip': 'application/zip',
};

const AVATAR_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: LocalFileStorageService,
  ) {}

  async upload(
    file: UploadedFileInput | undefined,
    owner: FileOwner,
    purpose: FilePurpose = 'file',
  ): Promise<FileObject> {
    if (!file?.buffer.length) {
      throw new BadRequestException('file.required');
    }

    const validated = purpose === 'avatar'
      ? this.validateAvatar(file)
      : this.validateGeneralFile(file);
    const directory = purpose === 'avatar' ? 'avatars' : 'files';
    const objectKey = `${directory}/${owner.type}/${owner.id}/${randomUUID()}.${validated.extension}`;

    await this.storage.save(objectKey, file.buffer);
    try {
      return await this.prisma.fileObject.create({
        data: {
          ownerType: owner.type,
          ownerId: owner.id,
          purpose,
          objectKey,
          originalName: basename(file.originalname).slice(0, 255) || 'file',
          mimeType: validated.mimeType,
          extension: validated.extension,
          size: file.buffer.length,
        },
      });
    } catch (error) {
      await this.storage.delete(objectKey).catch(() => undefined);
      throw error;
    }
  }

  async openOwnedFile(id: number, owner: FileOwner) {
    const record = await this.findOwnedFile(id, owner);
    const file = await this.storage.open(record.objectKey);
    return { record, ...file };
  }

  async openAvatar(ownerType: FileOwnerType, ownerId: number, filename: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/.test(filename)) {
      throw new NotFoundException('file.notFound');
    }
    const extension = filename.slice(filename.lastIndexOf('.') + 1);
    const file = await this.storage.open(`avatars/${ownerType}/${ownerId}/${filename}`);
    return { ...file, mimeType: AVATAR_MIME_TYPES[extension] };
  }

  async removeOwnedFile(id: number, owner: FileOwner): Promise<void> {
    const record = await this.findOwnedFile(id, owner);
    await this.prisma.fileObject.delete({ where: { id: record.id } });
    await this.storage.delete(record.objectKey);
  }

  async removeAvatar(objectKey: string, owner: FileOwner): Promise<void> {
    const record = await this.prisma.fileObject.findFirst({
      where: { objectKey, ownerType: owner.type, ownerId: owner.id, purpose: 'avatar' },
    });
    if (!record) return;
    await this.prisma.fileObject.delete({ where: { id: record.id } });
    await this.storage.delete(record.objectKey);
  }

  getAvatarUrl(avatar?: string | null): string | undefined {
    if (!avatar) return undefined;
    if (/^(https?:\/\/|\/api\/)/.test(avatar)) return avatar;
    return `/api/file-assets/${avatar}`;
  }

  toRecord(record: FileObject): FileRecord {
    const prefix = record.ownerType === 'admin' ? 'admin' : 'miniapp';
    return {
      id: record.id,
      originalName: record.originalName,
      mimeType: record.mimeType,
      extension: record.extension,
      size: record.size,
      downloadUrl: `/api/${prefix}/files/${record.id}/content`,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private async findOwnedFile(id: number, owner: FileOwner): Promise<FileObject> {
    const record = await this.prisma.fileObject.findFirst({
      where: { id, ownerType: owner.type, ownerId: owner.id, purpose: 'file' },
    });
    if (!record) {
      throw new NotFoundException('file.notFound');
    }
    return record;
  }

  private validateGeneralFile(file: UploadedFileInput) {
    if (file.buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException('file.tooLarge');
    }
    const extension = extname(basename(file.originalname)).toLowerCase();
    const mimeType = FILE_MIME_TYPES[extension];
    if (!mimeType) {
      throw new BadRequestException('file.invalidType');
    }
    return { extension: extension.slice(1), mimeType };
  }

  private validateAvatar(file: UploadedFileInput) {
    if (file.buffer.length > MAX_AVATAR_SIZE) {
      throw new BadRequestException('file.avatarTooLarge');
    }
    const buffer = file.buffer;
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { extension: 'jpg', mimeType: 'image/jpeg' };
    }
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return { extension: 'png', mimeType: 'image/png' };
    }
    if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
      return { extension: 'webp', mimeType: 'image/webp' };
    }
    throw new BadRequestException('file.invalidAvatar');
  }
}
