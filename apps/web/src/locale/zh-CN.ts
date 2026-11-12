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
  // 按钮类权限名称（权限树 / 角色分配权限展示用）
  'menu.system.adminUser.add': '新增用户',
  'menu.system.adminUser.edit': '编辑用户',
  'menu.system.adminUser.delete': '删除用户',
  'menu.system.role.add': '新增角色',
  'menu.system.role.edit': '编辑角色',
  'menu.system.role.delete': '删除角色',
  'menu.system.permission.add': '新增权限',
  'menu.system.permission.edit': '编辑权限',
  'menu.system.permission.delete': '删除权限',
  'menu.member.edit': '编辑会员',
  'menu.member.delete': '删除会员',
  // 只分配了菜单、没有分配任何子页面时的占位提示
  'empty.menu.title': '暂无可用页面',
  'empty.menu.desc':
    '当前菜单下还没有分配任何页面权限，请联系管理员为该角色分配子页面后再访问。',
  'empty.menu.tip':
    '如果管理员已为你分配页面权限，刷新页面或重新登录后即可访问。',
  'empty.menu.reload': '刷新页面',
  'empty.menu.backHome': '返回首页',
  'navbar.title': 'Admin Template',
  'navbar.action.locale': '切换为中文',
  'messageBox.logout': '退出登录',
  'http.error': '请求失败',
  'http.loginFailed': '登录失败',
  'http.forbidden': '无权限访问',
  'http.invalidResponse': '服务器响应格式错误',
  ...localeSettings,
  ...localeLogin,
  ...localeSystemRole,
  ...localeSystemPermission,
  ...localeSystemAdminUser,
  ...localeSystemProfile,
  ...localeMember,
};
