import { DirectiveBinding } from 'vue';
import { useUserStore } from '@/store';

function checkPermission(el: HTMLElement, binding: DirectiveBinding) {
  const { value } = binding;
  const userStore = useUserStore();

  if (!value) {
    throw new Error(
      `need permission code! Like v-permission="'system:user:add'" or v-permission="['system:user:add', 'system:user:edit']"`,
    );
  }

  const permissionCodes: string[] = Array.isArray(value) ? value : [value];

  // 超级管理员直接通过
  if (userStore.roles.includes('super_admin')) return;

  // 检查是否拥有任一所需权限码
  const hasPermission = permissionCodes.some((code: string) =>
    userStore.permissions.includes(code),
  );

  if (!hasPermission && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

export default {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    checkPermission(el, binding);
  },
};
