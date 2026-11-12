export interface AppConfig {
  nodeEnv: string;
  port: number;
  jwt: {
    secret: string;
    refreshSecret: string;
    accessExpires: string;
    refreshExpires: string;
  };
  jwtMember: {
    secret?: string;
    refreshSecret?: string;
    accessExpires: string;
    refreshExpires: string;
  };
  cors: {
    origin: string;
    credentials: boolean;
  };
}

/** 配置值由 ConfigModule 完成 .env 加载和启动校验后注入。 */
export default function configuration(): AppConfig {
  return {
    nodeEnv: process.env.NODE_ENV!,
    port: Number(process.env.PORT || 3000),
    jwt: {
      secret: process.env.JWT_SECRET!,
      refreshSecret: process.env.JWT_REFRESH_SECRET!,
      accessExpires: process.env.JWT_ACCESS_EXPIRES || '2h',
      refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
    },
    // C端会员 JWT [预留]，启用会员认证时再设为必需项
    jwtMember: {
      secret: process.env.JWT_MEMBER_SECRET,
      refreshSecret: process.env.JWT_MEMBER_REFRESH_SECRET,
      accessExpires: process.env.JWT_MEMBER_ACCESS_EXPIRES || '7d',
      refreshExpires: process.env.JWT_MEMBER_REFRESH_EXPIRES || '30d',
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    },
  };
}
