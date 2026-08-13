import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';
import { PermissionDto, PermissionTypeEnum } from '@admin-template/shared';

export class CreatePermissionDto implements PermissionDto {
  @ApiProperty({ description: '父ID，0=根节点', example: 0, default: 0 })
  @IsInt()
  @Min(0)
  parentId: number;

  @ApiProperty({
    description: '权限名称，存 i18n key（如 menu.system.adminUser）',
    example: 'menu.system.role',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '权限类型：1=菜单 2=按钮 3=API',
    example: 1,
    enum: [1, 2, 3],
  })
  @IsInt()
  @IsIn([1, 2, 3])
  type: PermissionTypeEnum;

  @ApiProperty({
    description: '权限标识（如 system:user:add）',
    example: 'system:role:view',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  permission?: string;

  @ApiProperty({
    description: '前端路由路径（菜单类型）',
    example: '/system/role',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  path?: string;

  @ApiProperty({
    description: '前端组件路径（菜单类型）',
    example: 'system/role/index',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  component?: string;

  @ApiProperty({
    description: '菜单图标',
    example: 'icon-settings',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiProperty({ description: '排序', example: 1, default: 0, required: false })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiProperty({
    description: '是否显示：0=隐藏 1=显示',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @IsIn([0, 1])
  visible?: number;
}
