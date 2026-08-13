import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsIn } from 'class-validator';
import { UpdateStatusDto } from '@admin-template/shared';

export class UpdateStatusDtoImpl implements UpdateStatusDto {
  @ApiProperty({ description: '状态：0=禁用 1=启用', example: 1 })
  @IsInt()
  @IsIn([0, 1])
  status: number;
}
