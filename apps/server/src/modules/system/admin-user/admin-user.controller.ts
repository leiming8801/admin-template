import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminUserService, AdminUserListQuery } from './admin-user.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { AssignRolesDtoImpl } from './dto/assign-roles.dto';
import { ResetPasswordDtoImpl } from './dto/reset-password.dto';
import { UpdateStatusDtoImpl } from './dto/update-status.dto';
import { RequirePermission } from '../../../common/decorators/require-permission.decorator';

@ApiTags('后台用户管理')
@ApiBearerAuth()
@Controller('system/admin-users')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @RequirePermission('system:user:view')
  @ApiOperation({ summary: '分页查询用户列表' })
  @ApiQuery({ name: 'page', description: '页码', required: false, type: Number })
  @ApiQuery({
    name: 'pageSize',
    description: '每页条数',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'username',
    description: '用户名（模糊搜索）',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: '状态：0=禁用 1=启用',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'roleId',
    description: '角色ID（筛选该角色下的用户）',
    required: false,
    type: Number,
  })
  async findAll(@Query() query: AdminUserListQuery) {
    return this.adminUserService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('system:user:view')
  @ApiOperation({ summary: '获取用户详情（含已分配角色ID列表）' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.adminUserService.findOne(id);
  }

  @Post()
  @RequirePermission('system:user:add')
  @ApiOperation({ summary: '创建用户' })
  async create(@Body() dto: CreateAdminUserDto) {
    return this.adminUserService.create(dto);
  }

  @Put(':id')
  @RequirePermission('system:user:edit')
  @ApiOperation({ summary: '编辑用户' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminUserService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('system:user:delete')
  @ApiOperation({ summary: '删除用户' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.adminUserService.remove(id);
    return null;
  }

  @Patch(':id/status')
  @RequirePermission('system:user:edit')
  @ApiOperation({ summary: '修改用户状态（启用/禁用）' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDtoImpl,
  ) {
    await this.adminUserService.updateStatus(id, dto.status);
    return null;
  }

  @Put(':id/roles')
  @RequirePermission('system:user:edit')
  @ApiOperation({ summary: '给用户分配角色' })
  async assignRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRolesDtoImpl,
  ) {
    await this.adminUserService.assignRoles(id, dto.roleIds);
    return null;
  }

  @Put(':id/password')
  @RequirePermission('system:user:edit')
  @ApiOperation({ summary: '重置用户密码' })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDtoImpl,
  ) {
    await this.adminUserService.resetPassword(id, dto.password);
    return null;
  }
}
