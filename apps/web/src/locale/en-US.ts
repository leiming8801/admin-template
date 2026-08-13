import localeLogin from '@/views/login/locale/en-US';
import localeSystemRole from '@/views/system/role/locale/en-US';
import localeSystemPermission from '@/views/system/permission/locale/en-US';
import localeSystemAdminUser from '@/views/system/admin-user/locale/en-US';
import localeSystemProfile from '@/views/system/profile/locale/en-US';
import localeMember from '@/views/member/locale/en-US';
import localeSettings from './en-US/settings';

export default {
  'menu.dashboard': 'Dashboard',
  'menu.system': 'System',
  'menu.system.adminUser': 'Admin Users',
  'menu.system.role': 'Roles',
  'menu.system.permission': 'Permissions',
  'menu.profile': 'Profile',
  'menu.member': 'Member',
  'menu.member.list': 'Member List',
  'navbar.title': 'Admin Template',
  'navbar.action.locale': 'Switch to English',
  'messageBox.logout': 'Logout',
  ...localeSettings,
  ...localeLogin,
  ...localeSystemRole,
  ...localeSystemPermission,
  ...localeSystemAdminUser,
  ...localeSystemProfile,
  ...localeMember,
};
