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
| 图标库 | Lucide (`@lucide/vue`) | 官方 Vue 包，tree-shakable SVG |
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

pnpm workspace monorepo，三个包：`apps/server`（NestJS 后端）、`apps/web`（Vue 3 前端）、`packages/shared`（前后端共享类型）。

完整目录树（含各子目录职责）与包依赖关系见 [项目架构概览](docs/项目架构概览.md) 第 2 节「Monorepo 结构」。

跨包硬约束（细节见上方文档）：

- 前端经 Vite alias 直接引用 shared 源码，后端经 `workspace:*` 引用其 `dist/` → 改 shared 后必须 `pnpm build`
- `apps/*` 下不单独建 `.qoder`，AI 资产全在仓库根（见 §10）

## 4. 核心约定

### 4.1 命名规范

- **包名**：`@admin-template/server`、`@admin-template/web`、`@admin-template/shared`
- **后端 Controller 路由前缀**：全局 `/api`，管理后台模块级如 `admin/auth`、`admin/system/admin-users`、`admin/system/roles`、`admin/system/permissions`、`admin/members`、`admin/dashboard`
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
- **认证会话**：双 Token 必须携带 `sid`；`admin_session` 只保存 Refresh Token 的 SHA-256 哈希，刷新必须轮换双 Token，登出/改密/重置密码/禁用用户必须撤销对应会话
- **超级管理员**：`super_admin` 角色绕过所有权限校验（前后端均有此逻辑）

### 4.3 前端编码约定

- **Token 存储**：accessToken 存 `localStorage` key `admin_access_token`，refreshToken 存 `admin_refresh_token`
- **动态路由**：`menuFromServer: true`（见 `settings.json`），路由从后端 `/api/admin/auth/menus` 获取并动态注册
- **菜单转路由**：`src/utils/menu-to-route.ts` 中 `transformMenusToRoutes()` 将菜单树转为 Vue Router 路由
- **权限控制**：
  - 路由级：`router/guard/permission.ts` 中的 `accessRouter()` 校验 `meta.roles` 或 `meta.requiresPermission`
  - 按钮级：`v-permission="'system:user:add'"` 指令，无权限的元素从 DOM 移除
- **i18n 同步**：请求拦截器自动设置 `Accept-Language` 头与前端当前语言同步
- **401 处理**：拦截器自动轮换 accessToken + refreshToken，两个新值都必须写入 localStorage 后重发请求；刷新失败跳转登录页
- **视图组件懒加载**：`import.meta.glob('@/views/**/*.vue')` 预加载，动态路由按 `component` 字段匹配
- **图标统一用 Lucide**：全站图标只从 `@lucide/vue` 引入，禁止新增 IconPark / Arco 图标（`ArcoVueIcon` 已从 `main.ts` 移除）
  - 页面内直接用：`import { Plus } from '@lucide/vue'` → `<Plus :size="16" />`，`size` 显式声明，颜色继承 `currentColor`
  - 菜单图标：`seed.ts` 的 `icon` 字段存 Lucide 官方 **kebab-case 名**（如 `layout-dashboard`、`users`），无任何前缀
  - 字符串转组件：只能经 `src/utils/icons.ts` 的 `menuIconMap` 白名单 + `resolveMenuIcon()`，**禁止** `import * as icons` 动态索引（会打包全部 7000+ 图标）
  - 新增菜单图标：先在 https://lucide.dev/icons 确认名称存在，再在 `menuIconMap` 注册，权限表单下拉会自动出现该项

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
pnpm db:migrate:dev       # 开发环境生成并执行迁移
pnpm db:migrate:deploy    # 测试/生产执行已提交迁移
pnpm db:migrate:status    # 查看迁移状态
pnpm db:push              # 临时原型同步（不生成迁移，禁止用于生产）
pnpm db:seed              # 增量同步种子数据（幂等，可重复执行）

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
| `VITE_API_BASE_URL` | 后端服务源地址（不含 `/api`，代理时留空） | `http://localhost:3000` |

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
7. **Prisma Schema 改动**：修改 `schema.prisma` 后执行 `pnpm db:migrate:dev` 生成并应用迁移，提交 `prisma/migrations/`；测试/生产只用 `pnpm db:migrate:deploy`。既有 `db push` 数据库先按部署文档基线化

## 10. AI 资产（`.qoder/`）

> 详细内容由工具按需加载，此处只作索引；新增或修改资产见 `write-rule-skill` / `write-agentmd-skill`。
> **落点原则**：全仓只有一个 `.qoder/`（仓库根）。资产按「通用性」切分，不按 app 目录切分——`apps/*` 下不单独建 `.qoder`，因为会话以仓库根为加载边界，子目录资产不会生效。app 专属资产也放根目录，靠 `description` 与下方「适用范围」圈定。
> **适用范围写法**：只允许写具体目录（`apps/web`、`apps/server`、`packages/shared`）或 `全仓`，不用「仅」「相关」这类模糊词；新增 app 时（如未来的 `apps/miniapp`）在每个受影响的资产上逐个补齐，不靠模型猜。

**规则 13 条**（6 常驻 / 7 按需），按作用域分组：

| 作用域 | 常驻 | 按需 |
|---|---|---|
| 全仓 | `intellectual-honesty-rule`、`operation-safety-rule`、`collaboration-boundary-rule`、`windows-encoding-rule`、`reuse-first-rule` | `docs-organization-rule`、`author-identity-rule` |
| `apps/web` | `i18n-rule` | `page-skeleton-rule`、`modal-style-rule` |
| `apps/web` + `apps/server` | — | `vxe-table-rule`（前端表格 + 后端日期格式）、`icon-usage-rule`（前端图标 + `seed.ts`）、`new-page-workflow-rule`（跨端五步） |

| 技能 | 适用范围 | 使用场景 |
|---|---|---|
| `code-review-skill` | 全仓 | 合入前评审：变更范围 / 契约一致性 / 逻辑 / 全链路 / 验证，P0–P3 分级 |
| `powershell-skill` | 全仓 | Windows 命令与脚本陷阱（编码、`$LASTEXITCODE`、分号、`curl.exe`） |
| `windows-encoding-skill` | 全仓 | 编码诊断、修复、UTF-8 无 BOM 写入脚本 |
| `doc-sync-skill` | 全仓 | 文档与代码漂移的最小同步 |
| `write-rule-skill` | 全仓 | 新增或修改 `.qoder/rules` 规则 |
| `write-agentmd-skill` | 全仓 | 维护本文件（地图而非手册，≤200 行） |
| `web-arco-design-vue` | `apps/web` | Arco 组件属性/事件/插槽/示例；**表格章节仅作属性名参考，业务表格走 `BasicTable`** |
