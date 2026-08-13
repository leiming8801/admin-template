export const AUTH_CONSTANTS = {
  /** JWT 策略名称 */
  JWT_STRATEGY: 'jwt',
  /** Token 类型 */
  TOKEN_TYPE_ACCESS: 'access' as const,
  TOKEN_TYPE_REFRESH: 'refresh' as const,
  /** Token scope */
  SCOPE_ADMIN: 'admin' as const,
  SCOPE_MEMBER: 'member' as const,
} as const;
