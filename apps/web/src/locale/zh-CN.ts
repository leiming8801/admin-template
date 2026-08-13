import localeLogin from '@/views/login/locale/zh-CN';
import localeSystemRole from '@/views/system/role/locale/zh-CN';
import localeSystemPermission from '@/views/system/permission/locale/zh-CN';
import localeSystemAdminUser from '@/views/system/admin-user/locale/zh-CN';
import localeSystemProfile from '@/views/system/profile/locale/zh-CN';
import localeMember from '@/views/member/locale/zh-CN';
import localeSettings from './zh-CN/settings';

export default {
  'menu.dashboard': '仪表盘',
  'menu.system': '系统管理',
  'menu.system.adminUser': '后台用户',
  'menu.system.role': '角色管理',
  'menu.system.permission': '权限管理',
  'menu.profile': '个人中心',
  'menu.member': '会员管理',
  'menu.member.list': '会员列表',
  'navbar.title': 'Admin Template',
  'navbar.action.locale': '切换为中文',
  'messageBox.logout': '退出登录',
  ...localeSettings,
  ...localeLogin,
  ...localeSystemRole,
  ...localeSystemPermission,
  ...localeSystemAdminUser,
  ...localeSystemProfile,
  ...localeMember,
};
