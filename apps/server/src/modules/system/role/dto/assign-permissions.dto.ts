import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';
import { AssignPermissionsDto } from '@admin-template/shared';

export class AssignPermissionsDtoImpl implements AssignPermissionsDto {
  @ApiProperty({
    description: '权限ID列表',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  permissionIds: number[];
}
