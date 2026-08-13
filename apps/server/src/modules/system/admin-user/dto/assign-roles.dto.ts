import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt } from 'class-validator';
import { AssignRolesDto } from '@admin-template/shared';

export class AssignRolesDtoImpl implements AssignRolesDto {
  @ApiProperty({
    description: '角色ID列表',
    example: [1, 2],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  roleIds: number[];
}
