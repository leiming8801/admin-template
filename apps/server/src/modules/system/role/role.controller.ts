import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RoleService, RoleListQuery } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDtoImpl } from './dto/assign-permissions.dto';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('角色管理')
@ApiBearerAuth()
@Controller('admin/system/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @RequirePermission('system:role:view')
  @ApiOperation({ summary: '分页查询角色列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false, type: Number })
  @ApiQuery({
    name: 'pageSize',
    description: '每页条数',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'name',
    description: '角色名称（模糊搜索）',
    required: false,
  })
  @ApiQuery({
    name: 'code',
    description: '角色编码（模糊搜索）',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: '状态：0=禁用 1=启用',
    required: false,
    type: Number,
  })
  async findAll(@Query() query: RoleListQuery) {
    return this.roleService.findAll(query);
  }

  @Get('all')
  @RequirePermission('system:role:view')
  @ApiOperation({ summary: '获取所有启用角色（下拉选择用）' })
  async findAllForSelect() {
    return this.roleService.findAllForSelect();
  }

  @Get(':id')
  @RequirePermission('system:role:view')
  @ApiOperation({ summary: '获取角色详情（含权限列表）' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roleService.findOne(id);
  }

  @Post()
  @RequirePermission('system:role:add')
  @ApiOperation({ summary: '创建角色' })
  async create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Put(':id')
  @RequirePermission('system:role:edit')
  @ApiOperation({ summary: '编辑角色' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('system:role:delete')
  @ApiOperation({ summary: '删除角色' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.roleService.remove(id);
    return null;
  }

  @Put(':id/permissions')
  @RequirePermission('system:role:edit')
  @ApiOperation({ summary: '给角色分配权限' })
  async assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPermissionsDtoImpl,
  ) {
    await this.roleService.assignPermissions(id, dto.permissionIds);
    return null;
  }
}
