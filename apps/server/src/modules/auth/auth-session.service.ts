import { createHash } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

type SessionRevokeReason =
  | 'logout'
  | 'password_changed'
  | 'password_reset'
  | 'user_disabled'
  | 'refresh_reused';

type SessionClient = PrismaService | Prisma.TransactionClient;

/** 后台会话持久化、状态校验、Refresh Token 轮换与撤销。 */
@Injectable()
export class AuthSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(
    userId: number,
    sessionId: string,
    refreshToken: string,
    expiresAt: Date,
    client: SessionClient = this.prisma,
  ): Promise<void> {
    await client.adminSession.create({
      data: {
        id: sessionId,
        userId,
        refreshTokenHash: this.hashRefreshToken(refreshToken),
        expiresAt,
        lastUsedAt: new Date(),
      },
    });
  }

  /** 查询仍有效的会话，并同步检查用户与角色状态。 */
  async getActiveSession(
    sessionId: string,
    userId: number,
    client: SessionClient = this.prisma,
  ) {
    const session = await client.adminSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            status: true,
            username: true,
            roles: { select: { role: { select: { status: true } } } },
          },
        },
      },
    });

    if (
      !session ||
      session.userId !== userId ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('auth.sessionInvalid');
    }
    if (session.user.status === 0) {
      throw new UnauthorizedException('auth.accountDisabled');
    }
    if (!session.user.roles.some((userRole) => userRole.role.status === 1)) {
      throw new UnauthorizedException('auth.roleDisabled');
    }

    return session;
  }

  async validateAccessSession(payload: JwtPayload): Promise<void> {
    if (!payload.sid) {
      throw new UnauthorizedException('auth.sessionInvalid');
    }
    await this.getActiveSession(payload.sid, payload.sub);
  }

  /** 原子轮换 Token 哈希；旧 Token 重放时先提交会话撤销再抛异常。 */
  async rotateRefreshToken(
    sessionId: string,
    userId: number,
    currentRefreshToken: string,
    newRefreshToken: string,
  ): Promise<void> {
    const currentHash = this.hashRefreshToken(currentRefreshToken);
    const newHash = this.hashRefreshToken(newRefreshToken);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      await this.getActiveSession(sessionId, userId, tx);

      const rotated = await tx.adminSession.updateMany({
        where: {
          id: sessionId,
          userId,
          refreshTokenHash: currentHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: {
          refreshTokenHash: newHash,
          lastUsedAt: now,
        },
      });
      if (rotated.count === 1) return 'rotated' as const;

      const latest = await tx.adminSession.findUnique({
        where: { id: sessionId },
        select: { refreshTokenHash: true, revokedAt: true },
      });
      if (
        latest &&
        !latest.revokedAt &&
        latest.refreshTokenHash !== currentHash
      ) {
        await tx.adminSession.updateMany({
          where: { id: sessionId, revokedAt: null },
          data: { revokedAt: new Date(), revokedReason: 'refresh_reused' },
        });
        return 'reused' as const;
      }
      return 'invalid' as const;
    });

    if (result === 'reused') {
      throw new UnauthorizedException('auth.refreshTokenReused');
    }
    if (result === 'invalid') {
      throw new UnauthorizedException('auth.sessionInvalid');
    }
  }

  async revokeSession(
    sessionId: string,
    userId: number,
    reason: SessionRevokeReason = 'logout',
  ): Promise<void> {
    await this.prisma.adminSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  async revokeAllUserSessions(
    userId: number,
    reason: SessionRevokeReason,
    client: SessionClient = this.prisma,
  ): Promise<void> {
    await client.adminSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
