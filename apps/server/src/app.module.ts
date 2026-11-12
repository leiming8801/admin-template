import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { I18nModule } from 'nestjs-i18n';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SystemModule } from './modules/system/system.module';
import { MemberModule } from './modules/member/member.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FileModule } from './modules/file/file.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { i18nOptions } from './i18n/i18n.config';
import configuration from './config';
import { validateEnvironment } from './config/validation';

@Module({
  imports: [
    // 环境变量加载与启动校验
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['apps/server/.env', '.env'],
      load: [configuration],
      validate: validateEnvironment,
    }),
    // i18n 多语言
    I18nModule.forRoot(i18nOptions),
    // Prisma 全局数据库
    PrismaModule,
    // 认证模块
    AuthModule,
    // 系统管理模块（后台用户/角色/权限）
    SystemModule,
    // 会员管理模块
    MemberModule,
    // 工作台模块
    DashboardModule,
    // 本地文件模块
    FileModule,
  ],
  providers: [
    // 全局异常过滤器（通过 DI 注入 I18nService，确保翻译已加载）
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // 全局 JWT 守卫（接口默认需要认证，@Public() 标记的接口跳过）
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局权限守卫（配合 @RequirePermission 装饰器校验权限码）
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
