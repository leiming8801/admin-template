---
name: new-page-workflow-rule
description: 新增业务页面时的完整流程规范，确保权限、后端接口、前端页面、locale 文案同步创建，避免遗漏。
alwaysApply: true
version: 1.0
last_verified: 2026-08-12
verified_against:
  - 'NestJS ^10.3.0'
  - 'Prisma 5.22.0'
  - 'vue ^3.4.0'
  - 'vue-i18n ^9.10.0'
---

# 新增业务页面完整流程规范

> **适用范围**：后台管理系统模板中所有新增业务页面（如后台用户管理、会员管理等）
> **加载方式**：始终加载

---

## 核心原则

新增一个业务页面时，必须同步完成以下 5 个步骤，缺一不可。每一步都有前置依赖关系，必须按顺序执行。

---

## 完整流程

### 第 1 步：后端 seed.ts 添加权限记录

在 `apps/server/prisma/seed.ts` 的 `permissionDefs` 数组中，按以下格式添加：

```typescript
// 菜单权限（type: 1）
{ name: 'menu.模块.资源', type: 1, path: '/模块/资源', component: '模块/资源/index', permission: '模块:资源:view', sort: N, parentName: 'menu.父级' },

// 按钮权限（type: 2），每个操作按钮一条
{ name: 'menu.模块.资源.add', type: 2, permission: '模块:资源:add', sort: 1, parentName: 'menu.模块.资源' },
{ name: 'menu.模块.资源.edit', type: 2, permission: '模块:资源:edit', sort: 2, parentName: 'menu.模块.资源' },
{ name: 'menu.模块.资源.delete', type: 2, permission: '模块:资源:delete', sort: 3, parentName: 'menu.模块.资源' },
```

**权限标识命名规则**：`模块:资源:操作` 三段式，冒号分隔

| 段   | 说明                              | 示例值                          |
| ---- | --------------------------------- | ------------------------------- |
| 模块 | 一级菜单分组                      | `system`、`member`              |
| 资源 | 子资源名                          | `user`、`role`、`permission`   |
| 操作 | 固定值                            | `view`/`add`/`edit`/`delete`   |

### 第 2 步：重新运行 seed 初始化数据库

```bash
cd apps/server
pnpm db:seed
```

> 注意：seed 会清空权限表并重建，不影响用户和角色数据。

### 第 3 步：后端 Controller 添加接口 + 权限装饰器

```typescript
// apps/server/src/modules/system/xxx/xxx.controller.ts
@Get()
@RequirePermission('模块:资源:view')   // 对应 seed 中的 permission 字段
@ApiOperation({ summary: '查询列表' })
async findAll() { ... }

@Post()
@RequirePermission('模块:资源:add')
@ApiOperation({ summary: '创建' })
async create() { ... }
```

> 权限码必须与 seed.ts 中定义的 `permission` 字段完全一致。

### 第 4 步：前端创建页面组件 + API 文件 + locale

| 必须创建的文件                        | 说明                                    |
| ------------------------------------- | --------------------------------------- |
| `views/模块/资源/index.vue`          | 页面入口，路径必须与 seed 的 component 一致 |
| `views/模块/资源/locale/zh-CN.ts`     | 中文文案                                |
| `views/模块/资源/locale/en-US.ts`     | 英文文案                                |
| `views/模块/资源/components/*.vue`   | 页面私有子组件（弹窗等）                 |
| `api/模块.ts`                         | API 请求函数                            |

> 页面组件路径 `views/模块/资源/index.vue` 必须与 seed.ts 中的 `component: '模块/资源/index'` 对应，否则动态路由注册时找不到组件。

### 第 5 步：locale 聚合文件导入

在 `src/locale/zh-CN.ts` 和 `src/locale/en-US.ts` 中导入并展开新模块的 locale：

```typescript
import localeXxx from '@/views/模块/资源/locale/zh-CN';
// ...
export default {
  // ...
  'menu.模块.资源': '中文名称',
  ...localeXxx,
};
```

---

## 检查清单

新增页面后，逐项确认：

- [ ] seed.ts 已添加菜单权限 + 按钮权限记录
- [ ] 已运行 `pnpm db:seed` 更新数据库
- [ ] 后端 Controller 已添加 `@RequirePermission` 装饰器，权限码与 seed 一致
- [ ] 前端 `views/模块/资源/index.vue` 已创建，路径与 seed 的 component 对应
- [ ] `api/模块.ts` 已创建 API 函数
- [ ] `views/模块/资源/locale/zh-CN.ts` 和 `en-US.ts` 已创建
- [ ] `src/locale/zh-CN.ts` 和 `en-US.ts` 已导入并展开新 locale
- [ ] 菜单文案 `menu.模块.资源` 已添加到聚合 locale 文件
- [ ] 页面所有文案使用 `$t()` / `t()`，无硬编码中文
- [ ] 页面按钮使用 `v-permission="'模块:资源:操作'"` 指令控制显示

---

## 常见遗漏

| 遗漏项                              | 后果                                           |
| ----------------------------------- | ---------------------------------------------- |
| 忘记运行 seed                       | 菜单不显示，权限守卫 403                       |
| component 路径与前端文件不匹配      | 菜单显示但点击后页面空白                       |
| 权限码拼写不一致（seed vs Controller） | 后端接口 403，前端按钮不显示                   |
| 忘记在聚合 locale 中导入            | 菜单名称显示为 i18n key 原文                   |
| 忘记 `v-permission` 指令            | 无权限用户也能看到操作按钮                     |
