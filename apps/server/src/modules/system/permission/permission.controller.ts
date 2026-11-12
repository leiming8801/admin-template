import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('权限管理')
@ApiBearerAuth()
@Controller('admin/system/permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get('tree')
  @RequirePermission('system:permission:view')
  @ApiOperation({ summary: '获取权限树' })
  async getTree() {
    return this.permissionService.getTree();
  }

  @Post()
  @RequirePermission('system:permission:add')
  @ApiOperation({ summary: '创建权限' })
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionService.create(dto);
  }

  @Put(':id')
  @RequirePermission('system:permission:edit')
  @ApiOperation({ summary: '编辑权限' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('system:permission:delete')
  @ApiOperation({ summary: '删除权限' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.permissionService.remove(id);
    return null;
  }
}
