import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { RefreshTokenRequest } from '@admin-template/shared';

export class RefreshTokenDto implements RefreshTokenRequest {
  @ApiProperty({ description: '刷新令牌' })
  @IsString()
  @MinLength(10, { message: 'refreshToken 格式不正确' })
  refreshToken: string;
}
