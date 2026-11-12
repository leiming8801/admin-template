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
  // Button permission labels (used by permission tree / role assigning)
  'menu.system.adminUser.add': 'Create User',
  'menu.system.adminUser.edit': 'Edit User',
  'menu.system.adminUser.delete': 'Delete User',
  'menu.system.role.add': 'Create Role',
  'menu.system.role.edit': 'Edit Role',
  'menu.system.role.delete': 'Delete Role',
  'menu.system.permission.add': 'Create Permission',
  'menu.system.permission.edit': 'Edit Permission',
  'menu.system.permission.delete': 'Delete Permission',
  'menu.member.edit': 'Edit Member',
  'menu.member.delete': 'Delete Member',
  // Placeholder when only the menu itself is granted without any sub page
  'empty.menu.title': 'No page available',
  'empty.menu.desc':
    'No page permission has been assigned under this menu yet. Please contact the administrator to assign sub pages.',
  'empty.menu.tip':
    'If page permissions have already been assigned, reload the page or sign in again to continue.',
  'empty.menu.reload': 'Reload page',
  'empty.menu.backHome': 'Back to home',
  'navbar.title': 'Admin Template',
  'navbar.action.locale': 'Switch to English',
  'messageBox.logout': 'Logout',
  'http.error': 'Request failed',
  'http.loginFailed': 'Login failed',
  'http.forbidden': 'You do not have permission to access this resource',
  'http.invalidResponse': 'Invalid server response',
  ...localeSettings,
  ...localeLogin,
  ...localeSystemRole,
  ...localeSystemPermission,
  ...localeSystemAdminUser,
  ...localeSystemProfile,
  ...localeMember,
};
