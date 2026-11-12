---
name: icon-usage-rule
description: 图标使用约束——全站图标唯一来源是 @lucide/vue（Lucide），禁止 IconPark 与 Arco 图标；页面内直接 import 组件，菜单图标经 src/utils/icons.ts 的 menuIconMap 白名单从 seed.ts 的 icon 字段（kebab-case 名）解析。新增菜单图标、页面图标或图标不显示时使用。
alwaysApply: false
version: 2.0
owner: 雷敏
created: 2026-11-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against:
  - '@lucide/vue ^1.72.0'
  - 'apps/web/src/utils/icons.ts（menuIconMap 31 个白名单）'
  - 'apps/web/src/components/menu/index.vue（resolveMenuIcon 渲染）'
  - 'apps/server/prisma/seed.ts（icon 字段实际值）'
---

# 图标使用约束（Lucide）

> **适用范围**：`apps/web` 全站图标（菜单图标、按钮图标、页面内图标）+ `apps/server` seed 中的菜单 `icon` 字段
> **加载方式**：按需加载（新增菜单 / 页面图标，或图标不显示时读取）

---

## 唯一来源

| 项       | 说明                                                                     |
| -------- | ------------------------------------------------------------------------ |
| 包       | `@lucide/vue`（官方 Vue 包，注意不是已废弃的 `lucide-vue-next`）          |
| 图标目录 | https://lucide.dev/icons                                                 |
| 引入方式 | `import { Plus } from '@lucide/vue'`                                      |
| 常用 props | `:size`（默认 24）、`color`（默认 `currentColor`）、`stroke-width`（默认 2） |

> `main.ts` 已移除 `app.use(ArcoVueIcon)`，`index.html` 已移除 IconPark CDN，`vite.config.base.ts` 已移除 `isCustomElement`。新增代码不得恢复这三处。

---

## 菜单图标链路

```
seed.ts 的 icon 字段（kebab-case，如 'layout-dashboard'）
  → 权限表落库 → /api/auth/menus 返回
  → components/menu/index.vue 调 resolveMenuIcon(name)
  → src/utils/icons.ts 的 menuIconMap 命中 → 返回组件
  → h(component, { size: 16 }) 渲染，菜单图标 16px
```

未命中的名字返回 `null`，菜单按「无图标」渲染，不抛错、不阻塞页面。

> Lucide 组件默认 `size=24`，且渲染出的 class 是 `lucide lucide-xxx`（**没有** `lucide-icon`）。所以尺寸必须在渲染处传 `size`，别指望用 `.lucide-icon` 选择器覆盖。

---

## 核心规则

| # | 约束                                                                                                |
| :- | :-------------------------------------------------------------------------------------------------- |
| 1 | 图标只能来自 `@lucide/vue`，禁止引入 IconPark、`@arco-design/web-vue/es/icon` 或其他图标库           |
| 2 | 页面内图标直接 `import` 组件用，并在标签上显式写 `:size`（菜单 16、列表内联 14、按钮 16、卡片主图标 24、空状态 30） |
| 3 | 菜单图标只能配在 `seed.ts` 的 `icon` 字段，值取 Lucide 官方 **kebab-case 名**，不带 `icon-` / `iconpark:` 任何前缀 |
| 4 | 字符串转组件只允许走 `src/utils/icons.ts` 的 `menuIconMap` + `resolveMenuIcon()`，业务页面禁止重复实现 |
| 5 | **禁止** `import * as icons from '@lucide/vue'` 后动态索引：会打包全部 7000+ 图标，破坏 tree-shaking        |
| 6 | 颜色继承 `currentColor`，禁止在图标节点上写死色值（暗色模式不会跟随）                                  |
| 7 | 新增图标前先在 https://lucide.dev/icons 确认名称存在；编造的名字在 `menuIconMap` 里查不到，菜单会静默无图标 |

---

## 白名单（`src/utils/icons.ts` 已注册，可直填 seed）

| 场景         | icon 值                                |
| :----------- | :------------------------------------- |
| 工作台       | `layout-dashboard`                     |
| 会员管理     | `users`                                |
| 系统管理     | `settings`                             |
| 个人设置     | `circle-user`                          |
| 权限 / 角色  | `shield`、`key-round`、`lock`          |
| 数据 / 服务  | `database`、`server`、`monitor`、`package` |
| 内容 / 文档  | `file-text`、`folder`、`list`、`tag`   |
| 其余         | `bell`、`calendar`、`chart-bar`、`chart-pie`、`chart-column`、`clock`、`globe`、`house`、`mail`、`message-square`、`smartphone`、`wrench`、`star`、`sparkles`、`user`、`layout-grid` |

权限表单的图标字段是下拉选择（选项来自 `menuIconOptions`，与上表同源），正常操作不会填出失效图标。

---

## 禁令清单

| 禁止操作                                              | 原因                                        | 正确做法                                     |
| :---------------------------------------------------- | :------------------------------------------ | :------------------------------------------- |
| 新增 `iconpark:xxx` 或 `<icon-xxx />`                 | 两套体系已整体下线，残留节点渲染为空        | 换成 `@lucide/vue` 组件                       |
| 在页面里自行 `switch` / `map` 图标名前缀              | 多套解析并存，改一处漏一处                  | 复用 `resolveMenuIcon()`                      |
| 菜单图标写死在前端路由表                              | 与后端菜单数据源不一致                      | 配在 `seed.ts` 的 `icon` 字段                 |
| `import * as icons` 动态取图标                        | 全量打包，首屏体积暴增                      | 在 `menuIconMap` 显式 import 需要的图标       |
| 图标上写 `style="color:#xxx"`                         | 暗色模式不跟随                              | 用 `var(--color-text-2)` 等 Token 或继承色    |
| 用 CSS 类（如 `.lucide-icon`）改 Lucide 尺寸        | 官方 class 是 `.lucide`，选择器压根不命中，图标仍为 24px | 在组件上传 `:size` / `size` prop            |
| 换回 Arco 图标补漏                                    | 与全站视觉不一致，且 `ArcoVueIcon` 已移除   | 在 Lucide 中找语义最接近的图标                |
