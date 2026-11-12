import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: number;
  username: string;
  /** 服务端会话 ID，Access/Refresh Token 均必须携带 */
  sid: string;
  /** 单次 Token ID，Refresh Token 轮换时重新生成 */
  jti?: string;
  type: 'access' | 'refresh';
  scope?: string;
}

/**
 * 从 request.user 中提取当前登录用户信息
 * @example
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
