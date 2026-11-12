import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { UpdateProfileRequest } from '@admin-template/shared';

export class UpdateProfileDto implements UpdateProfileRequest {
  @ApiProperty({ description: '用户昵称', example: '管理员' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  nickname: string;
}
