import type { Component } from 'vue';
import {
  Bell,
  Calendar,
  ChartBar,
  ChartColumn,
  ChartPie,
  CircleUser,
  Clock,
  Database,
  FileText,
  Folder,
  Globe,
  House,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  List,
  Lock,
  Mail,
  MessageSquare,
  Monitor,
  Package,
  Server,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  User,
  Users,
  Wrench,
} from '@lucide/vue';

/**
 * 菜单图标注册表。
 *
 * - key 是权限表 `icon` 字段存储的值，取 Lucide 官方 kebab-case 名
 * - 只在用到时才 import，保持 @lucide/vue 的 tree-shaking 生效
 * - 新增图标：先在 https://lucide.dev/icons 确认名称存在，再在此注册
 */
export const menuIconMap: Record<string, Component> = {
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  users: Users,
  user: User,
  'circle-user': CircleUser,
  settings: Settings,
  shield: Shield,
  'key-round': KeyRound,
  lock: Lock,
  bell: Bell,
  'chart-bar': ChartBar,
  'chart-pie': ChartPie,
  'chart-column': ChartColumn,
  'file-text': FileText,
  folder: Folder,
  calendar: Calendar,
  clock: Clock,
  globe: Globe,
  house: House,
  mail: Mail,
  'message-square': MessageSquare,
  package: Package,
  server: Server,
  database: Database,
  monitor: Monitor,
  smartphone: Smartphone,
  wrench: Wrench,
  list: List,
  tag: Tag,
  star: Star,
  sparkles: Sparkles,
};

/** 权限表单下拉可选项，与注册表同源，避免两处维护 */
export const menuIconOptions = Object.keys(menuIconMap);

/**
 * 把权限表里的图标名解析为组件。
 * 未注册的名字返回 null，菜单按「无图标」渲染，不抛错、不阻塞页面。
 */
export function resolveMenuIcon(name?: string | null): Component | null {
  if (!name) return null;
  return menuIconMap[name] ?? null;
}
