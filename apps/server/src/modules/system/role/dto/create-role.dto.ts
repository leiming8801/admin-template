import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsIn,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';
import { RoleDto } from '@admin-template/shared';

export class CreateRoleDto implements RoleDto {
  @ApiProperty({ description: '角色名称', example: '运营专员' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: '角色编码（可选，留空则系统自动生成）',
    example: 'operator',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'system.role.codeFormat',
  })
  code?: string;

  @ApiProperty({ description: '排序', example: 2, default: 0, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiProperty({
    description: '状态：0=禁用 1=启用',
    example: 1,
    default: 1,
    required: false,
  })
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
