import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { config } from '../../../config';
import { AUTH_CONSTANTS } from '../auth.constants';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

/**
 * JWT 策略 - 解析和验证 accessToken
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, AUTH_CONSTANTS.JWT_STRATEGY) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwt.secret,
    });
  }

  /**
   * 验证通过后，payload 会被挂载到 request.user 上
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // 校验 token 类型和 scope
    if (payload.type !== AUTH_CONSTANTS.TOKEN_TYPE_ACCESS) {
      throw new UnauthorizedException('auth.invalidTokenType');
    }
    if (payload.scope && payload.scope !== AUTH_CONSTANTS.SCOPE_ADMIN) {
      throw new UnauthorizedException('auth.invalidTokenScope');
    }
    return payload;
  }
}
