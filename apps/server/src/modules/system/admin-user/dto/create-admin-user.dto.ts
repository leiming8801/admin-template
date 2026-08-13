import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsIn,
  MaxLength,
  MinLength,
  IsEmail,
} from 'class-validator';
import { AdminUserDto } from '@admin-template/shared';

export class CreateAdminUserDto implements AdminUserDto {
  @ApiProperty({ description: '登录用户名', example: 'admin' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({ description: '昵称', example: '管理员' })
  @IsString()
  @MaxLength(50)
  nickname: string;

  @ApiProperty({ description: '邮箱', example: 'admin@example.com', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ description: '手机号', example: '13800138000', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: '头像URL', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiProperty({
    description: '状态：0=禁用 1=启用',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  status: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
