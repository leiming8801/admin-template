import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { LoginRequest } from '@admin-template/shared';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'admin', description: '登录用户名' })
  @IsString()
  @MinLength(2, { message: '用户名长度不能少于2位' })
  @MaxLength(50, { message: '用户名长度不能超过50位' })
  username: string;

  @ApiProperty({ example: 'admin123', description: '登录密码' })
  @IsString()
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(50, { message: '密码长度不能超过50位' })
  password: string;
}
