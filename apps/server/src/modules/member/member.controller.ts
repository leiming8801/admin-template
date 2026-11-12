import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MemberService, MemberListQuery } from './member.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateStatusDtoImpl } from './dto/update-status.dto';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@ApiTags('会员管理')
@ApiBearerAuth()
@Controller('admin/members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  @RequirePermission('member:view')
  @ApiOperation({ summary: '分页查询会员列表' })
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
    name: 'phone',
    description: '手机号（模糊搜索）',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: '状态：0=禁用 1=启用',
    required: false,
    type: Number,
  })
  async findAll(@Query() query: MemberListQuery) {
    return this.memberService.findAll(query);
  }

  @Get(':id')
  @RequirePermission('member:view')
  @ApiOperation({ summary: '获取会员详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberService.findOne(id);
  }

  @Put(':id')
  @RequirePermission('member:edit')
  @ApiOperation({ summary: '编辑会员信息' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.memberService.update(id, dto);
  }

  @Patch(':id/status')
  @RequirePermission('member:edit')
  @ApiOperation({ summary: '修改会员状态（启用/禁用）' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDtoImpl,
  ) {
    await this.memberService.updateStatus(id, dto.status);
    return null;
  }

  @Delete(':id')
  @RequirePermission('member:delete')
  @ApiOperation({ summary: '删除会员' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.memberService.remove(id);
    return null;
  }
}
