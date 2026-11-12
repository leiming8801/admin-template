import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AUTH_CONSTANTS } from './auth.constants';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
import { AuthSessionService } from './auth-session.service';
import { LoginResult, UserProfile, MenuItem, RefreshTokenResult } from '@admin-template/shared';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

/**
 * 认证服务 - 登录、Token 签发/刷新、用户信息获取、动态菜单获取
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  /** 用户登录 */
  async login(dto: LoginDto, ip?: string): Promise<LoginResult> {
    const user = await this.prisma.adminUser.findUnique({
      where: { username: dto.username },
      include: {
        roles: { include: { role: { select: { status: true } } } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('auth.loginFailed');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('auth.loginFailed');
    }

    if (user.status === 0) {
      throw new UnauthorizedException('auth.accountDisabled');
    }

    // 用户所有角色均被禁用时拒绝登录
    const hasActiveRole = user.roles.some((ur) => ur.role.status === 1);
    if (!hasActiveRole) {
      throw new UnauthorizedException('auth.roleDisabled');
    }

    // 创建固定有效期的服务端会话，数据库只保存 Refresh Token 哈希
    const sessionId = randomUUID();
    const expiresIn = this.parseExpiresToSeconds(
      this.configService.getOrThrow<string>('jwt.accessExpires'),
    );
    const refreshExpiresIn = this.parseExpiresToSeconds(
      this.configService.getOrThrow<string>('jwt.refreshExpires'),
    );
    const sessionExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000);
    const accessToken = this.generateAccessToken(
      user.id,
      user.username,
      sessionId,
    );
    const refreshToken = this.generateRefreshToken(
      user.id,
      sessionId,
      refreshExpiresIn,
    );

    // 会话与最后登录信息同事务写入
    await this.prisma.$transaction(async (tx) => {
      await this.authSessionService.createSession(
        user.id,
        sessionId,
        refreshToken,
        sessionExpiresAt,
        tx,
      );
      await tx.adminUser.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: ip,
        },
      });
    });

    return { accessToken, refreshToken, expiresIn };
  }

  /** 轮换双 Token；旧 Refresh Token 重放会撤销当前会话。 */
  async refresh(refreshToken: string): Promise<RefreshTokenResult> {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('auth.refreshTokenInvalid');
    }

    if (payload.type !== AUTH_CONSTANTS.TOKEN_TYPE_REFRESH) {
      throw new UnauthorizedException('auth.invalidTokenType');
    }
    if (payload.scope !== AUTH_CONSTANTS.SCOPE_ADMIN) {
      throw new UnauthorizedException('auth.invalidTokenScope');
    }
    if (!payload.sid) {
      throw new UnauthorizedException('auth.sessionInvalid');
    }

    // 新 Token 沿用会话固定过期时间，不因刷新无限延长会话。
    const session = await this.authSessionService.getActiveSession(
      payload.sid,
      payload.sub,
    );
    const refreshExpiresIn = Math.max(
      1,
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
    );
    const accessToken = this.generateAccessToken(
      payload.sub,
      session.user.username,
      payload.sid,
    );
    const newRefreshToken = this.generateRefreshToken(
      payload.sub,
      payload.sid,
      refreshExpiresIn,
    );
    const expiresIn = this.parseExpiresToSeconds(
      this.configService.getOrThrow<string>('jwt.accessExpires'),
    );

    await this.authSessionService.rotateRefreshToken(
      payload.sid,
      payload.sub,
      refreshToken,
      newRefreshToken,
    );
    return { accessToken, refreshToken: newRefreshToken, expiresIn };
  }

  /** 撤销当前会话，使其 Access/Refresh Token 均不可继续使用。 */
  async logout(sessionId: string, userId: number): Promise<void> {
    await this.authSessionService.revokeSession(sessionId, userId);
  }

  /** 获取当前用户信息 + 角色权限（仅含启用角色） */
  async getProfile(userId: number): Promise<UserProfile> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { role: { status: 1 } },
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('auth.tokenExpired');
    }

    const roles = user.roles.map((ur) => ur.role.code);
    const permissions = new Set<string>();
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        if (rp.permission.permission) {
          permissions.add(rp.permission.permission);
        }
      }
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar || undefined,
      roles,
      permissions: Array.from(permissions),
    };
  }

  /** 更新当前用户昵称 */
  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<void> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });
    if (!user) {
      throw new UnauthorizedException('auth.tokenExpired');
    }
    if (user.status === 0) {
      throw new UnauthorizedException('auth.accountDisabled');
    }

    await this.prisma.adminUser.update({
      where: { id: userId },
      data: { nickname: dto.nickname },
    });
  }

  /** 验证当前密码后修改当前用户密码 */
  async updatePassword(userId: number, dto: UpdatePasswordDto): Promise<void> {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('auth.tokenExpired');
    }
    if (user.status === 0) {
      throw new UnauthorizedException('auth.accountDisabled');
    }

    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('auth.oldPasswordIncorrect');
    }
    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('auth.newPasswordSame');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.adminUser.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      await this.authSessionService.revokeAllUserSessions(
        userId,
        'password_changed',
        tx,
      );
    });
  }

  /** 获取当前用户的动态菜单树 */
  async getMenus(userId: number): Promise<MenuItem[]> {
    // 查询用户的启用角色
    const userRoles = await this.prisma.adminUserRole.findMany({
      where: { userId, role: { status: 1 } },
      select: { role: { select: { code: true } } },
    });
    const roleCodes = userRoles.map((ur) => ur.role.code);

    let permissions: { id: number; name: string; path: string | null; component: string | null; icon: string | null; parentId: number; sort: number; visible: number; type: number; }[];

    if (roleCodes.includes('super_admin')) {
      // 超级管理员拥有所有菜单权限
      permissions = await this.prisma.permission.findMany({
        where: { type: 1, visible: 1 },
        orderBy: [{ sort: 'asc' }],
        select: {
          id: true,
          name: true,
          path: true,
          component: true,
          icon: true,
          parentId: true,
          sort: true,
          visible: true,
          type: true,
        },
      });
    } else {
      // 普通用户：查询角色关联的权限
      permissions = await this.prisma.permission.findMany({
        where: {
          type: 1,
          visible: 1,
          roles: {
            some: {
              role: {
                status: 1,
                users: {
                  some: { userId },
                },
              },
            },
          },
        },
        orderBy: [{ sort: 'asc' }],
        select: {
          id: true,
          name: true,
          path: true,
          component: true,
          icon: true,
          parentId: true,
          sort: true,
          visible: true,
          type: true,
        },
      });
    }

    // 个人设置为所有用户的默认权限，不依赖角色分配
    const profilePerm = await this.prisma.permission.findFirst({
      where: { name: 'menu.profile', type: 1 },
    });
    if (profilePerm && !permissions.some((p) => p.id === profilePerm.id)) {
      permissions.push(profilePerm);
    }

    return this.buildMenuTree(permissions);
  }

  /** 生成 accessToken */
  private generateAccessToken(
    userId: number,
    username: string,
    sessionId: string,
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      username,
      sid: sessionId,
      jti: randomUUID(),
      type: AUTH_CONSTANTS.TOKEN_TYPE_ACCESS,
      scope: AUTH_CONSTANTS.SCOPE_ADMIN,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.secret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.accessExpires'),
    });
  }

  /** 生成 refreshToken，过期时间不超过所属会话的固定过期时间。 */
  private generateRefreshToken(
    userId: number,
    sessionId: string,
    expiresIn: number,
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      username: '',
      sid: sessionId,
      jti: randomUUID(),
      type: AUTH_CONSTANTS.TOKEN_TYPE_REFRESH,
      scope: AUTH_CONSTANTS.SCOPE_ADMIN,
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn,
    });
  }

  /** 将权限列表构建为菜单树 */
  private buildMenuTree(
    permissions: { id: number; name: string; path: string | null; component: string | null; icon: string | null; parentId: number; sort: number; visible: number; type: number; }[],
  ): MenuItem[] {
    const map = new Map<number, MenuItem & { parentId: number }>();

    for (const p of permissions) {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        path: p.path || '',
        component: p.component || undefined,
        icon: p.icon || undefined,
        children: [],
        parentId: p.parentId,
      });
    }

    const tree: MenuItem[] = [];
    for (const item of map.values()) {
      if (item.parentId === 0) {
        tree.push(item);
      } else {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children!.push(item);
        } else {
          tree.push(item);
        }
      }
    }

    // 清理 parentId
    const cleanTree = (items: MenuItem[]) => {
      for (const item of items) {
        delete (item as any).parentId;
        if (item.children && item.children.length === 0) {
          delete item.children;
        }
        if (item.children) {
          cleanTree(item.children);
        }
      }
    };
    cleanTree(tree);

    return tree;
  }

  /** 解析过期时间字符串为秒数 */
  private parseExpiresToSeconds(expires: string): number {
    const match = expires.match(/^(\d+)([smhd])$/);
    if (!match) return 7200; // 默认 2 小时
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] || 1);
  }
}
