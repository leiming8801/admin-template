import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { ResetPasswordDto } from '@admin-template/shared';

export class ResetPasswordDtoImpl implements ResetPasswordDto {
  @ApiProperty({ description: '新密码', example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}
