export type FileOwnerType = 'admin' | 'member';
export type FilePurpose = 'avatar' | 'file';

export interface FileOwner {
  type: FileOwnerType;
  id: number;
}

export interface UploadedFileInput {
  buffer: Buffer;
  originalname: string;
  size: number;
}
