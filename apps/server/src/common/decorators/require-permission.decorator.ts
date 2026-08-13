import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * 声明接口所需的权限码
 * @example
 * @RequirePermission('system:user:view')
 * @RequirePermission('system:user:add', 'system:user:edit')
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
