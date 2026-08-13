/**
 * 默认头像批次 — 随机选取一个作为用户默认头像
 */

import avatar1 from '@/assets/images/avatar1.svg?url';
import avatar2 from '@/assets/images/avatar2.svg?url';
import avatar3 from '@/assets/images/avatar3.svg?url';
import avatar4 from '@/assets/images/avatar4.svg?url';
import avatar5 from '@/assets/images/avatar5.svg?url';
import avatar6 from '@/assets/images/avatar6.svg?url';
import avatar7 from '@/assets/images/avatar7.svg?url';
import avatar8 from '@/assets/images/avatar8.svg?url';
import avatar9 from '@/assets/images/avatar9.svg?url';
import avatar10 from '@/assets/images/avatar10.svg?url';
import avatar11 from '@/assets/images/avatar11.svg?url';
import avatar12 from '@/assets/images/avatar12.svg?url';

const DEFAULT_AVATARS: string[] = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
  avatar9,
  avatar10,
  avatar11,
  avatar12,
];

/**
 * 从默认头像批次中随机返回一个头像 URL
 */
export function getRandomAvatar(): string {
  const index = Math.floor(Math.random() * DEFAULT_AVATARS.length);
  return DEFAULT_AVATARS[index];
}

/**
 * 如果 avatar 为空则返回随机默认头像，否则原样返回
 */
export function resolveAvatar(avatar?: string | null): string {
  return avatar || getRandomAvatar();
}

export { DEFAULT_AVATARS };
