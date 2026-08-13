export const config = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    accessExpires: process.env.JWT_ACCESS_EXPIRES || '2h',
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  // C端会员 JWT [预留]
  jwtMember: {
    secret: process.env.JWT_MEMBER_SECRET || 'default-member-secret',
    refreshSecret: process.env.JWT_MEMBER_REFRESH_SECRET || 'default-member-refresh-secret',
    accessExpires: process.env.JWT_MEMBER_ACCESS_EXPIRES || '7d',
    refreshExpires: process.env.JWT_MEMBER_REFRESH_EXPIRES || '30d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
};
