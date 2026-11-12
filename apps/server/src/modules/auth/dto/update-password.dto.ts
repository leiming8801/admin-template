import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { UpdatePasswordRequest } from '@admin-template/shared';

export class UpdatePasswordDto implements UpdatePasswordRequest {
  @ApiProperty({ description: '当前密码' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  oldPassword: string;

  @ApiProperty({ description: '新密码', example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}
