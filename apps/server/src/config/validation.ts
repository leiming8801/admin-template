type EnvironmentVariables = Record<string, string | undefined>;

const DEVELOPMENT_ACCESS_SECRET =
  'local-development-access-secret-change-before-production';
const DEVELOPMENT_REFRESH_SECRET =
  'local-development-refresh-secret-change-before-production';

const INVALID_SECRETS = new Set([
  'default-secret',
  'default-refresh-secret',
  'default-member-secret',
  'default-member-refresh-secret',
]);

const EXPIRES_PATTERN = /^\d+[smhd]$/;

/** 启动前校验环境变量，错误信息只包含变量名，不回显敏感值。 */
export function validateEnvironment(
  env: EnvironmentVariables,
): EnvironmentVariables {
  const errors: string[] = [];
  const nodeEnv = env.NODE_ENV;

  if (!nodeEnv?.trim()) {
    errors.push('NODE_ENV 不能为空，必须显式指定运行环境');
  } else if (!['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push('NODE_ENV 仅支持 development、test、production');
  }

  if (!env.DATABASE_URL?.trim()) {
    errors.push('DATABASE_URL 不能为空');
  }

  validateSecret('JWT_SECRET', env.JWT_SECRET, nodeEnv || '', errors);
  validateSecret('JWT_REFRESH_SECRET', env.JWT_REFRESH_SECRET, nodeEnv || '', errors);

  if (
    env.JWT_SECRET &&
    env.JWT_REFRESH_SECRET &&
    env.JWT_SECRET === env.JWT_REFRESH_SECRET
  ) {
    errors.push('JWT_SECRET 与 JWT_REFRESH_SECRET 必须使用不同的值');
  }

  validateExpires('JWT_ACCESS_EXPIRES', env.JWT_ACCESS_EXPIRES, errors);
  validateExpires('JWT_REFRESH_EXPIRES', env.JWT_REFRESH_EXPIRES, errors);

  if (env.PORT) {
    const port = Number(env.PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.push('PORT 必须是 1-65535 之间的整数');
    }
  }

  if (env.CORS_ORIGIN !== undefined && !env.CORS_ORIGIN.trim()) {
    errors.push('CORS_ORIGIN 设置后不能为空');
  }

  if (errors.length > 0) {
    throw new Error(`环境变量校验失败：\n- ${errors.join('\n- ')}`);
  }

  return env;
}

function validateSecret(
  name: string,
  value: string | undefined,
  nodeEnv: string,
  errors: string[],
): void {
  if (!value?.trim()) {
    errors.push(`${name} 不能为空`);
    return;
  }

  if (value.length < 32) {
    errors.push(`${name} 长度不能少于 32 个字符`);
  }

  const normalizedValue = value.toLowerCase();
  if (
    INVALID_SECRETS.has(value) ||
    normalizedValue.startsWith('your-') ||
    normalizedValue.includes('change-in-production')
  ) {
    errors.push(`${name} 不能使用默认值或占位值`);
  }

  if (
    nodeEnv === 'production' &&
    [DEVELOPMENT_ACCESS_SECRET, DEVELOPMENT_REFRESH_SECRET].includes(value)
  ) {
    errors.push(`${name} 不能在生产环境使用示例开发密钥`);
  }
}

function validateExpires(
  name: string,
  value: string | undefined,
  errors: string[],
): void {
  if (value && !EXPIRES_PATTERN.test(value)) {
    errors.push(`${name} 必须使用数字加 s/m/h/d 的格式，例如 2h 或 7d`);
  }
}
