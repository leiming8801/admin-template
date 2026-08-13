# AGENTS.md — AI 编码助手上下文指南

> 本文件为 AI 编码助手（如 Cursor、Qoder、Copilot 等）提供项目上下文，帮助快速理解工程结构、编码规范与核心约定，减少无效探索。

## 1. 项目身份

- **项目名称**：Admin Template（后台管理系统模板）
- **定位**：可复用的后台管理系统基础脚手架，包含登录认证、RBAC 权限控制、后台用户管理、会员管理四大核心模块
- **系统名称约定**：界面文案、locale 文件、弹窗中的系统名称**必须**为 `Admin Template`，不得使用其他名称

## 2. 技术栈速览

| 层 | 技术 | 版本要求 |
|---|---|---|
| 前端框架 | Vue 3 + TypeScript | Vue 3.4+ |
| UI 组件库 | Arco Design Pro (Vue) + VxeTable | Arco 2.55+ |
| 第三方图标 | IconPark (ByteDance) | CDN Web Component |
| 构建工具 | Vite | 5+ |
| 状态管理 | Pinia | 2+ |
| 路由 | Vue Router | 4+ |
| HTTP | Axios | 1+ |
| 前端 i18n | vue-i18n | 9+ |
| 后端框架 | NestJS + TypeScript | NestJS 10+ |
| ORM | Prisma | 5+ |
| 数据库 | MySQL | 8.0+ |
| 认证 | JWT (双 Token: access + refresh) | @nestjs/jwt |
| 后端 i18n | nestjs-i18n | 10+ |
| API 文档 | Swagger | @nestjs/swagger |
| 包管理 | pnpm + workspace | pnpm 9+ |
| 构建编排 | turbo | 2+ |
| 共享类型 | @admin-template/shared (workspace 包) | - |

## 3. 工程结构

```
admin-template/
├── apps/
│   ├── server/                    # NestJS 后端
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 数据模型定义
│   │   │   └── seed.ts            # 种子数据
│   │   ├── src/
│   │   │   ├── common/            # 装饰器、守卫、过滤器、拦截器、工具
│   │   │   ├── config/            # 环境变量配置
│   │   │   ├── i18n/              # 后端多语言（zh-CN / en-US）
│   │   │   ├── modules/
│   │   │   │   ├── auth/          # 认证模块（登录/刷新/用户信息/动态菜单）
│   │   │   │   ├── system/        # 系统管理（后台用户/角色/权限）
│   │   │   │   ├── member/        # 会员管理
│   │   │   │   └── dashboard/     # 工作台统计
│   │   │   ├── prisma/            # PrismaService 全局注入
│   │   │   ├── app.module.ts      # 根模块
│   │   │   └── main.ts           # 启动入口（CORS / Swagger / 全局管道）
│   │   └── package.json
│   └── web/                       # Vue3 前端
│       ├── src/
│       │   ├── api/                # Axios 请求封装 + 拦截器
│       │   ├── components/        # 公共组件（表格/菜单/导航栏/标签栏等）
│       │   ├── config/            # 应用配置 settings.json
│       │   ├── directive/         # v-permission 权限指令
│       │   ├── hooks/             # 组合式函数（权限/语言/用户）
│       │   ├── layout/            # 布局组件
│       │   ├── locale/            # 前端多语言聚合
│       │   ├── router/            # 路由 + 守卫 + 动态路由
│       │   ├── store/             # Pinia（user / app / tab-bar）
│       │   ├── utils/             # 工具函数（Token/头像/菜单转换等）
│       │   ├── views/             # 页面（login/dashboard/system/member/profile）
│       │   ├── App.vue
│       │   └── main.ts            # 前端启动入口
│       └── package.json
├── packages/
│   └── shared/                    # 前后端共享类型定义
│       └── src/
│           ├── index.ts           # 统一导出
│           ├── common.ts          # ApiResponse / PageQuery / PageResult / 枚举
│           ├── auth.ts            # LoginResult / UserProfile / MenuItem
│           ├── system.ts          # AdminUser / Role / Permission 及 DTO
│           ├── member.ts          # Member 及 DTO
│           └── dashboard.ts       # DashboardStats
├── docs/                          # 项目文档（中文命名，含系统设计文档）
├── docker-compose.yml             # MySQL + Server + Web 容器编排
├── turbo.json                     # turbo 构建任务配置
├── pnpm-workspace.yaml            # workspace 声明
├── AGENTS.md                      # AI 编码助手上下文指南
└── package.json                   # 根 package.json（turbo 脚本入口）
```

## 4. 核心约定

### 4.1 命名规范

- **包名**：`@admin-template/server`、`@admin-template/web`、`@admin-template/shared`
- **后端 Controller 路由前缀**：全局 `/api`，模块级如 `auth`、`system/admin-users`、`system/roles`、`system/permissions`、`members`、`dashboard`
- **权限码格式**：`模块:资源:操作`，如 `system:user:add`、`member:edit`
- **菜单 name 字段**：存储 i18n key（如 `menu.system.adminUser`），前端 `t()` 翻译；自定义菜单可直接写显示名称
- **角色编码**：小写字母 + 数字 + 下划线，如 `super_admin`、`operator`

### 4.2 后端编码约定

- **接口默认需要认证**：全局注册了 `JwtAuthGuard` 和 `PermissionGuard`，公开接口用 `@Public()` 装饰器标记
- **权限校验**：在 Controller 方法上用 `@RequirePermission('system:user:view')` 声明所需权限码
- **异常消息**：Service / Guard / Strategy 层 throw 时**只传 i18n key**（如 `'auth.loginFailed'`），由全局 `AllExceptionsFilter` 根据 `Accept-Language` 头统一翻译
- **响应格式**：全局 `TransformInterceptor` 自动包装为 `{ code: 200, message: 'success', data }`，Controller 直接返回业务数据即可
- **分页约定**：返回 `{ list, total, page, pageSize }`，查询参数用 `page` / `pageSize`
- **密码加密**：使用 `bcryptjs`，hash 轮数 10
- **超级管理员**：`super_admin` 角色绕过所有权限校验（前后端均有此逻辑）

### 4.3 前端编码约定

- **Token 存储**：accessToken 存 `localStorage` key `admin_access_token`，refreshToken 存 `admin_refresh_token`
- **动态路由**：`menuFromServer: true`（见 `settings.json`），路由从后端 `/api/auth/menus` 获取并动态注册
- **菜单转路由**：`src/utils/menu-to-route.ts` 中 `transformMenusToRoutes()` 将菜单树转为 Vue Router 路由
- **权限控制**：
  - 路由级：`router/guard/permission.ts` 中的 `accessRouter()` 校验 `meta.roles` 或 `meta.requiresPermission`
  - 按钮级：`v-permission="'system:user:add'"` 指令，无权限的元素从 DOM 移除
- **i18n 同步**：请求拦截器自动设置 `Accept-Language` 头与前端当前语言同步
- **401 处理**：拦截器自动用 refreshToken 刷新 accessToken 并重发请求；刷新失败跳转登录页
- **视图组件懒加载**：`import.meta.glob('@/views/**/*.vue')` 预加载，动态路由按 `component` 字段匹配
- **菜单图标混用**：Arco Design 图标和 IconPark 第三方图标混用，通过前缀区分
  - Arco 图标：`icon-xxx`（如 `icon-dashboard`），作为 Vue 组件渲染
  - IconPark 图标：`iconpark:xxx`（如 `iconpark:dashboard`），渲染为 Web Component `<iconpark-icon>`
  - IconPark CDN 脚本在 `index.html` 中引入，Vite 配置 `isCustomElement` 识别 `iconpark-icon` 标签
  - 图标渲染逻辑在 `components/menu/index.vue` 中，根据前缀自动选择渲染方式

### 4.4 共享类型约定

- 前后端共享的接口类型定义在 `packages/shared/src/` 下
- 前端通过 Vite alias `@admin-template/shared` → `packages/shared/src/index.ts` 直接引用源码
- 后端通过 `workspace:*` 引用编译后的 `dist/`
- **修改共享类型后**：后端需重新 `pnpm build`（shared 包），前端 Vite 热更新自动生效

## 5. 常用命令

```bash
# 开发
pnpm dev                  # 同时启动前后端
pnpm dev:server           # 仅后端 (http://localhost:3000)
pnpm dev:web              # 仅前端 (http://localhost:5173)

# 构建
pnpm build                # 构建所有子包
pnpm build:server         # 仅后端
pnpm build:web            # 仅前端

# 数据库
pnpm db:generate          # 生成 Prisma Client
pnpm db:push              # 同步 Schema 到数据库
pnpm db:seed              # 填充种子数据

# 其他
pnpm lint                 # 代码检查
pnpm clean                # 清理 dist 和 node_modules
```

## 6. 环境变量

后端配置在 `apps/server/.env`（参考 `.env.example`）：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `DATABASE_URL` | MySQL 连接字符串 | `mysql://root:root123456@localhost:3306/admin_template` |
| `JWT_SECRET` | 管理员 accessToken 密钥 | - |
| `JWT_ACCESS_EXPIRES` | accessToken 有效期 | `2h` |
| `JWT_REFRESH_SECRET` | refreshToken 密钥 | - |
| `JWT_REFRESH_EXPIRES` | refreshToken 有效期 | `7d` |
| `JWT_MEMBER_*` | C端会员 JWT（预留，当前不使用） | - |
| `PORT` | 后端端口 | `3000` |

前端配置在 `apps/web/.env.development` 和 `.env.production`：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `VITE_API_BASE_URL` | 前端 API 地址 | `http://localhost:3000/api` |

## 7. 默认账户

种子数据创建的默认管理员：

- 用户名：`admin`
- 密码：`admin123`

## 8. 文档导航

| 文档 | 路径 | 说明 |
|---|---|---|
| 项目 README | `README.md` | 快速上手与项目概览 |
| 系统设计文档 | `docs/系统设计文档.md` | 完整设计规格（数据库/API/前端/时序图/实施计划） |
| 文档索引 | `docs/README.md` | docs 目录导航 |
| 项目架构概览 | `docs/项目架构概览.md` | 整体架构与模块关系 |
| 后端模块详解 | `docs/后端模块详解.md` | NestJS 各模块职责与实现 |
| 前端模块详解 | `docs/前端模块详解.md` | Vue3 各模块职责与实现 |
| 数据库设计文档 | `docs/数据库设计文档.md` | 表结构与 ER 关系 |
| 认证与权限设计 | `docs/认证与权限设计.md` | JWT 双 Token + RBAC 全链路 |
| 多语言国际化文档 | `docs/多语言国际化文档.md` | 前后端 i18n 实现方案 |
| 共享类型包说明 | `docs/共享类型包说明.md` | shared 包类型定义 |
| 部署与运维指南 | `docs/部署与运维指南.md` | Docker 部署与运维 |

## 9. AI 助手工作指引

1. **修改后端接口时**：同步更新 `packages/shared/src/` 中对应的类型定义，保持前后端类型一致
2. **新增 API 接口时**：确认是否需要 `@Public()` 或 `@RequirePermission()`，默认所有接口需认证
3. **新增页面时**：在 `seed.ts` 中添加对应权限菜单项（type=1 菜单 + type=2 按钮），否则用户看不到菜单
4. **异常消息**：throw 时传 i18n key 而非中文文案，在 `src/i18n/zh-CN/messages.json` 和 `en-US/messages.json` 中添加翻译
5. **前端权限**：页面级用路由 `meta.requiresPermission`，按钮级用 `v-permission` 指令
6. **共享类型改动**：修改后执行 `pnpm build`（shared 包）使后端生效
7. **Prisma Schema 改动**：修改 `schema.prisma` 后执行 `pnpm db:push` 同步，再 `pnpm db:generate` 更新 Client
