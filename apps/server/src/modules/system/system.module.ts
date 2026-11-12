import { Module } from '@nestjs/common';
import { PermissionController } from './permission/permission.controller';
import { PermissionService } from './permission/permission.service';
import { RoleController } from './role/role.controller';
import { RoleService } from './role/role.service';
import { AdminUserController } from './admin-user/admin-user.controller';
import { AdminUserService } from './admin-user/admin-user.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PermissionController, RoleController, AdminUserController],
  providers: [PermissionService, RoleService, AdminUserService],
  exports: [PermissionService, RoleService, AdminUserService],
})
export class SystemModule {}
