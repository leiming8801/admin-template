# Admin Template — 后台管理系统模板

可复用的后台管理系统模板，内置**登录认证**、**RBAC 权限控制**、**后台用户管理**、**会员管理**四大核心功能模块，作为后续业务系统的基础脚手架。

## 核心特性

- **JWT 双 Token 认证**：accessToken（2h）+ refreshToken（7d），自动刷新无感续期
- **RBAC 权限体系**：用户-角色-权限三级关联，支持菜单/按钮/API 三种粒度
- **动态路由**：登录后从后端获取菜单树，前端动态注册路由，菜单按权限渲染
- **按钮级权限控制**：`v-permission` 自定义指令，无权限自动移除 DOM 元素
- **前后端多语言**：前端 vue-i18n + 后端 nestjs-i18n，支持中英文切换，请求头自动同步
- **前后端类型共享**：`@admin-template/shared` 包统一管理接口类型，编译时类型安全
- **Monorepo 工程化**：pnpm workspace + turbo 构建编排，一键启动/构建/数据库操作
- **Swagger API 文档**：自动生成接口文档，支持 Bearer Token 调试

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 前端框架 | Vue 3 + TypeScript | 3.4+ |
| UI 组件库 | Arco Design Pro (Vue) + VxeTable | 2.55+ |
| 第三方图标 | IconPark (ByteDance) | CDN Web Component |
| 构建工具 | Vite | 5+ |
| 状态管理 | Pinia | 2+ |
| 路由 | Vue Router | 4+ |
| HTTP 请求 | Axios | 1+ |
| 前端国际化 | vue-i18n | 9+ |
| 后端框架 | NestJS + TypeScript | 10+ |
| ORM | Prisma | 5+ |
| 数据库 | MySQL | 8.0+ |
| 认证 | JWT（双 Token） | @nestjs/jwt |
| API 文档 | Swagger | @nestjs/swagger |
| 后端国际化 | nestjs-i18n | 10+ |
| 包管理 | pnpm + workspace | 9+ |
| 构建编排 | turbo | 2+ |

## 工程结构

```
admin-template/
├── apps/
│   ├── server/                    # NestJS 后端
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 数据库模型定义（6 张表）
│   │   │   └── seed.ts            # 种子数据（管理员+角色+权限菜单）
│   │   ├── src/
│   │   │   ├── common/            # 装饰器 / 守卫 / 过滤器 / 拦截器
│   │   │   ├── config/            # 环境变量配置
│   │   │   ├── i18n/              # 后端多语言（zh-CN / en-US）
│   │   │   ├── modules/
│   │   │   │   ├── auth/          # 认证模块
│   │   │   │   ├── system/        # 系统管理（用户/角色/权限）
│   │   │   │   ├── member/        # 会员管理
│   │   │   │   └── dashboard/     # 工作台统计
│   │   │   ├── prisma/            # PrismaService 全局注入
│   │   │   ├── app.module.ts      # 根模块
│   │   │   └── main.ts           # 启动入口
│   │   └── package.json
│   └── web/                       # Vue3 前端
│       ├── src/
│       │   ├── api/                # Axios 请求封装 + 拦截器
│       │   ├── components/        # 公共组件
│       │   ├── directive/         # v-permission 权限指令
│       │   ├── hooks/             # 组合式函数
│       │   ├── layout/            # 布局组件
│       │   ├── locale/            # 前端多语言
│       │   ├── router/            # 路由 + 守卫 + 动态路由
│       │   ├── store/             # Pinia 状态管理
│       │   ├── utils/             # 工具函数
│       │   └── views/             # 页面
│       └── package.json
├── packages/
│   └── shared/                    # 前后端共享类型定义
│       └── src/
│           ├── common.ts          # ApiResponse / PageResult / 枚举
│           ├── auth.ts            # LoginResult / UserProfile / MenuItem
│           ├── system.ts          # AdminUser / Role / Permission
│           ├── member.ts          # Member
│           └── dashboard.ts       # DashboardStats
├── docs/                          # 项目文档（中文命名，含系统设计文档）
├── docker-compose.yml             # MySQL + Server + Web 容器编排
├── turbo.json                     # turbo 构建任务配置
├── pnpm-workspace.yaml            # workspace 声明
├── AGENTS.md                      # AI 编码助手上下文指南
└── package.json                   # 根 package.json
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- MySQL 8.0+（可使用 Docker）

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example apps/server/.env
# 按需修改 .env 中的 JWT_SECRET、DATABASE_URL 等
```

### 3. 初始化数据库

```bash
# 启动 MySQL（可选，使用 Docker）
docker compose up mysql -d

# 创建数据库
mysql -u root -p -e "CREATE DATABASE admin_template CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 同步 Prisma Schema 到数据库
pnpm db:push

# 生成 Prisma Client
pnpm db:generate

# 填充种子数据（管理员账户 + 角色 + 权限菜单）
pnpm db:seed
```

### 4. 启动开发

```bash
# 同时启动前后端
pnpm dev

# 或单独启动
pnpm dev:server    # 后端 http://localhost:3000
pnpm dev:web       # 前端 http://localhost:5173
```

### 5. 访问应用

- 前端界面：http://localhost:5173
- 后端 API：http://localhost:3000/api
- Swagger 文档：http://localhost:3000/docs

## 默认账户

种子数据创建的默认管理员账户：

| 字段 | 值 |
|---|---|
| 用户名 | `admin` |
| 密码 | `admin123` |
| 角色 | 超级管理员（`super_admin`，拥有所有权限） |

## 常用命令

| 命令 | 说明 |
|---|---|
| `pnpm dev` | 同时启动前后端开发服务 |
| `pnpm dev:server` | 仅启动后端 |
| `pnpm dev:web` | 仅启动前端 |
| `pnpm build` | 构建所有子包 |
| `pnpm build:server` | 仅构建后端 |
| `pnpm build:web` | 仅构建前端 |
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:push` | 同步 Schema 到数据库 |
| `pnpm db:seed` | 填充种子数据 |
| `pnpm lint` | 代码检查 |
| `pnpm clean` | 清理 dist 和 node_modules |

## 核心功能

### 认证（JWT 双 Token）

- 登录返回 `accessToken`（2h 有效）和 `refreshToken`（7d 有效）
- `accessToken` 过期时，前端拦截 401 响应，自动用 `refreshToken` 刷新并重发请求
- 刷新失败（refreshToken 过期）跳转登录页
- 管理员和 C端会员 JWT 使用独立密钥，互不通用（C端为预留设计）

### RBAC 权限控制

- **数据模型**：用户-角色-权限三级关联（5 张表 + 1 张会员表）
- **后端**：`@RequirePermission` 装饰器声明权限码 + `PermissionGuard` 全局守卫校验
- **前端路由级**：路由守卫 `accessRouter()` 校验 `meta.roles` 或 `meta.requiresPermission`
- **前端按钮级**：`v-permission="'system:user:add'"` 指令，无权限移除元素
- **动态菜单**：登录后从 `/api/auth/menus` 获取菜单树，按权限过滤后动态注册路由
- **超级管理员**：`super_admin` 角色绕过所有权限校验

### 后台用户管理

- 用户 CRUD、状态启用/禁用、角色分配、密码重置
- 权限码：`system:user:view` / `add` / `edit` / `delete`

### 角色管理

- 角色 CRUD、权限分配（权限树多选）
- 权限码：`system:role:view` / `add` / `edit` / `delete`

### 权限管理

- 权限树形管理（菜单/按钮/API 三种类型）
- 权限码：`system:permission:view` / `add` / `edit` / `delete`

### 会员管理

- 独立于 RBAC 体系，管理 C端会员数据
- 支持列表查询、详情、编辑、状态管理、删除
- 权限码：`member:view` / `edit` / `delete`

### 多语言

- **前端**：vue-i18n，支持中文/英文切换，语言选择持久化到 localStorage
- **后端**：nestjs-i18n，通过 `Accept-Language` 请求头判断语言
- **自动同步**：前端请求拦截器自动设置 `Accept-Language` 头与当前语言同步
- **组件库国际化**：Arco Design 和 VxeTable 均跟随项目语言切换
- **菜单名称**：后端存储 i18n key，前端 `t()` 翻译，无翻译时显示原文

## 环境变量

| 变量 | 说明 | 默认值 |
|---|---|---|
| `DATABASE_URL` | MySQL 连接字符串 | `mysql://root:root123456@localhost:3306/admin_template` |
| `JWT_SECRET` | 管理员 accessToken 密钥 | - |
| `JWT_ACCESS_EXPIRES` | accessToken 有效期 | `2h` |
| `JWT_REFRESH_SECRET` | refreshToken 密钥 | - |
| `JWT_REFRESH_EXPIRES` | refreshToken 有效期 | `7d` |
| `JWT_MEMBER_*` | C端会员 JWT（预留） | - |
| `PORT` | 后端端口 | `3000` |
| `VITE_API_BASE_URL` | 前端 API 地址 | `http://localhost:3000/api` |

## Docker 部署

```bash
# 一键启动所有服务（MySQL + 后端 + 前端）
docker compose up -d

# 访问
# 前端: http://localhost
# 后端 API: http://localhost:3000/api
# Swagger 文档: http://localhost:3000/docs
```

## 文档

详细文档位于 `docs/` 目录，提供完整的架构说明和模块详解：

| 文档 | 说明 |
|---|---|
| [AGENTS.md](./AGENTS.md) | AI 编码助手上下文指南 |
| [docs/系统设计文档.md](./docs/系统设计文档.md) | 系统设计文档（完整设计规格） |
| [docs/README.md](./docs/README.md) | 文档目录导航 |
| [docs/项目架构概览.md](./docs/项目架构概览.md) | 整体架构与模块关系 |
| [docs/后端模块详解.md](./docs/后端模块详解.md) | NestJS 各模块职责与实现 |
| [docs/前端模块详解.md](./docs/前端模块详解.md) | Vue3 各模块职责与实现 |
| [docs/数据库设计文档.md](./docs/数据库设计文档.md) | 表结构与 ER 关系 |
| [docs/认证与权限设计.md](./docs/认证与权限设计.md) | JWT 双 Token + RBAC 全链路 |
| [docs/多语言国际化文档.md](./docs/多语言国际化文档.md) | 前后端 i18n 实现方案 |
| [docs/共享类型包说明.md](./docs/共享类型包说明.md) | shared 包类型定义 |
| [docs/部署与运维指南.md](./docs/部署与运维指南.md) | Docker 部署与运维 |

## License

MIT
