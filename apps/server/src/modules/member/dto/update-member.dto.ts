import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsIn,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { MemberDto } from '@admin-template/shared';

export class UpdateMemberDto implements MemberDto {
  @ApiProperty({ description: '昵称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiProperty({ description: '头像URL', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiProperty({ description: '性别：0=未知 1=男 2=女', required: false })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1, 2])
  gender?: number;

  @ApiProperty({ description: '状态：0=禁用 1=启用', required: false })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  status?: number;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string;
}
