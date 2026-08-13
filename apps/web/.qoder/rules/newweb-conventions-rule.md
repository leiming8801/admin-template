---
name: newweb-conventions-rule
description: newWeb 知识库前端项目开发规范，覆盖目录结构、文件命名、组件编写、API 层、路由、状态管理、样式和 TypeScript 约定，确保所有页面遵循 Arco Design Pro 规范。
alwaysApply: true
version: 1.0
last_verified: 2026-07-13
verified_against:
  - '@arco-design/web-vue ^2.44.7'
  - 'vue ^3.2.40'
  - 'vite ^3.2.5'
  - 'pinia ^2.0.23'
  - 'vue-router ^4.0.14'
---

# newWeb 项目开发规范

> **适用范围**：`d:\个人\知识库\newWeb` 项目中所有新增、修改的前端页面和组件
> **加载方式**：始终加载

---

## 核心原则

| 原则              | 说明                                                                              |
| ----------------- | --------------------------------------------------------------------------------- |
| Arco 优先         | UI 组件必须使用 `@arco-design/web-vue`，禁止引入其他 UI 库                        |
| Composition API   | 所有组件必须使用 `<script setup lang="ts">`，禁止 Options API                     |
| TypeScript 全覆盖 | 所有新文件必须为 `.ts` 或 `.vue`（含 `<script setup lang="ts">`），禁止新增 `.js` |
| Design Token      | 颜色、间距、字号等视觉属性必须使用 CSS 变量，禁止硬编码                           |
| 最小权限导入      | 只导入需要的组件和工具，禁止 `import * as`                                        |

---

## 目录结构

> 适用范围：所有新增页面、组件、API 文件

| 必须遵守                                                    | 说明                                            |
| ----------------------------------------------------------- | ----------------------------------------------- |
| `views/` 子目录必须使用 kebab-case                          | 如 `knowledge/functions/`、`chat-analytics/`    |
| 每个页面模块必须在 `views/<module>/` 下拥有独立目录         | 禁止将页面组件直接放在 `views/` 根目录          |
| 页面私有子组件必须放在 `<page>/components/` 子目录          | 如 `views/knowledge/functions/components/`      |
| 页面国际化文案必须放在 `<page>/locale/` 子目录              | 如 `views/knowledge/functions/locale/zh-CN.ts`  |
| 公共组件必须放在 `src/components/` 并以 kebab-case 命名目录 | 如 `src/components/message-box/`                |
| hooks 必须放在 `src/hooks/`                                 | 禁止在 views 或 components 目录中定义通用 hooks |
| API 文件必须放在 `src/api/` 且按业务模块拆分                | 如 `src/api/knowledge.ts`、`src/api/chat.ts`    |
| 工具函数必须放在 `src/utils/`                               | 禁止在 api/ 或 hooks/ 中放置通用工具函数        |

---

## 文件命名

| 必须遵守                                            | 说明                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| Vue 组件文件必须使用 PascalCase                     | 如 `FunctionTable.vue`、`ChatPanel.vue`        |
| 页面入口文件统一命名为 `index.vue`                  | 如 `views/knowledge/functions/index.vue`       |
| TypeScript 文件必须使用 camelCase 或 kebab-case     | 如 `interceptor.ts`、`route-listener.ts`       |
| Store 模块必须以目录形式组织，入口为 `index.ts`     | 如 `store/modules/user/index.ts` + `types.ts`  |
| 类型定义文件必须命名为 `types.ts` 或 `typings.d.ts` | Store 配套 `types.ts`，路由使用 `typings.d.ts` |
| Less 样式文件必须使用 kebab-case                    | 如 `global.less`、`breakpoint.less`            |

---

## 组件编写

| 必须遵守                                            | 说明                                                           |
| --------------------------------------------------- | -------------------------------------------------------------- |
| 所有组件必须使用 `<script setup lang="ts">`         | 禁止使用 Options API（`data()`、`methods`、`computed`）        |
| 模板中 Arco 组件必须使用 `a-` 前缀                  | 如 `<a-button>`、`<a-table>`、`<a-form>`                       |
| 组件 props 必须使用 `defineProps<T>()` 泛型形式     | 禁止运行时 props 声明                                          |
| 组件事件必须使用 `defineEmits<T>()` 泛型形式        | 禁止运行时 emits 数组                                          |
| 模板属性必须使用 kebab-case                         | 如 `show-jumper`、`row-selection`、`@page-change`              |
| 双向绑定必须使用 `v-model` 或 `v-model:xxx`         | 如 `v-model:visible`、`v-model:selected-keys`                  |
| `<style>` 标签必须添加 `scoped` 属性                | 防止样式污染全局                                               |
| 深度穿透必须使用 `:deep()` 选择器                   | 禁止使用 `/deep/` 或 `>>>`                                     |
| Arco 图标必须从 `@arco-design/web-vue/es/icon` 导入 | 如 `import { IconSearch } from '@arco-design/web-vue/es/icon'` |
| 日期时间组件内部必须使用 `dayjs`                    | 禁止引入 Moment.js                                             |

---

## API 层

| 必须遵守                                         | 说明                                                 |
| ------------------------------------------------ | ---------------------------------------------------- |
| HTTP 请求必须使用 `axios`                        | 禁止使用 `fetch` 或其他 HTTP 库                      |
| API 函数必须导出为具名函数                       | 禁止 `export default function`                       |
| 列表查询命名：`fetchXxxList` 或 `fetchXxxs`      | 如 `fetchFunctions`、`fetchFaqs`                     |
| 单条查询命名：`fetchXxxById` 或 `fetchXxx`       | 如 `fetchFunctionById`                               |
| 创建操作命名：`createXxx`                        | 如 `createFunction`                                  |
| 更新操作命名：`updateXxx`                        | 如 `updateFunction`                                  |
| 删除操作命名：`deleteXxx`                        | 如 `deleteFunction`                                  |
| 批量删除命名：`batchDeleteXxxs`                  | 如 `batchDeleteFunctions`                            |
| API 文件中的类型必须与函数一起导出               | 如 `FunctionRecord`、`ListParams`、`FunctionPayload` |
| 请求拦截器统一在 `src/api/interceptor.ts` 中配置 | 禁止在各 API 文件中重复设置拦截器                    |
| 查询参数序列化必须使用 `query-string` 库         | 如 `paramsSerializer: (obj) => qs.stringify(obj)`    |

---

## 路由

| 必须遵守                                                         | 说明                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------- |
| 每个业务模块必须在 `src/router/routes/modules/` 下有独立路由文件 | 如 `knowledge.ts`、`chat.ts`                         |
| 路由文件必须导出 `AppRouteRecordRaw` 类型常量                    | 如 `const KNOWLEDGE: AppRouteRecordRaw = {...}`      |
| 顶层路由必须使用 `DEFAULT_LAYOUT` 作为 component                 | 从 `../base` 导入                                    |
| 路由 meta 必须包含 `locale`、`requiresAuth` 字段                 | `locale` 用于国际化菜单，`requiresAuth` 用于鉴权守卫 |
| 需要鉴权的路由 `meta.requiresAuth` 必须设为 `true`               | 由路由守卫统一处理跳转                               |
| 子路由 meta 必须包含 `roles` 字段                                | 如 `roles: ['*']` 表示所有角色可见                   |
| 页面组件必须使用动态导入 `() => import(...)`                     | 禁止静态 import 页面组件                             |

---

## 状态管理（Pinia）

| 必须遵守                                                          | 说明                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------- |
| Store 必须使用 `defineStore` 定义                                 | 禁止直接导出 reactive 对象作为全局状态                                |
| Store 必须放在 `src/store/modules/<name>/` 目录下                 | 每个 store 包含 `index.ts` 和 `types.ts`                              |
| Store state 类型必须独立定义在 `types.ts`                         | 如 `interface UserState { ... }`                                      |
| Store 必须在 `src/store/index.ts` 中统一导出                      | 如 `export { useAppStore, useUserStore }`                             |
| 组件中使用 Store 必须通过 `import { useXxxStore } from '@/store'` | 禁止直接从 modules 子路径导入                                         |
| 禁止在组件中直接读写 `localStorage`                               | 必须通过 Store action 或封装的 hooks 操作（如 `setToken`/`getToken`） |

---

## 样式规范

| 必须遵守                                         | 说明                                            |
| ------------------------------------------------ | ----------------------------------------------- |
| 颜色值必须使用 Arco Design CSS Token 变量        | 如 `var(--color-bg-1)`、`rgb(var(--primary-6))` |
| 禁止在组件中使用硬编码十六进制颜色               | 如 `#1d2129`、`#aa3bff`，必须替换为 Arco Token  |
| 禁止在组件中使用硬编码 `rgba()` 颜色             | 必须使用 `rgb(var(--xxx))` 或 CSS 变量          |
| 间距和尺寸优先使用 Arco Design spacing Token     | 如 `var(--spacing-4)`                           |
| 全局样式放在 `src/assets/style/` 下              | 如 `global.less`、`breakpoint.less`             |
| 组件样式必须写在 `<style scoped lang="less">` 中 | 禁止使用无 scoped 的 style                      |
| 覆盖 Arco 组件样式必须使用 `:deep()`             | 如 `:deep(.arco-table-cell) { ... }`            |
| 暗色模式兼容必须使用 CSS 变量而非固定色值        | 确保 `[arco-theme="dark"]` 下正常显示           |

---

## TypeScript 规范

| 必须遵守                                                         | 说明                                                                  |
| ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| 所有新文件必须使用 `.ts` 或 `.vue`（`<script setup lang="ts">`） | 禁止新增 `.js` 文件                                                   |
| API 响应类型必须显式定义 interface                               | 如 `interface HttpResponse<T> { code: number; data: T; msg: string }` |
| 函数参数和返回值必须有类型标注                                   | 禁止隐式 `any`                                                        |
| 枚举值必须使用 TypeScript `enum` 或常量对象 + `as const`         | 禁止使用魔法数字                                                      |
| 泛型命名必须有语义含义                                           | 如 `ListResult<T>` 而非 `Result<T>`                                   |

---

## 代码风格

| 必须遵守                                   | 说明                                    |
| ------------------------------------------ | --------------------------------------- |
| 缩进必须使用 2 空格                        | 禁止 Tab 缩进                           |
| 语句末尾必须使用分号                       | 遵循 Prettier 默认配置                  |
| 字符串必须使用单引号                       | 禁止双引号（模板字符串除外）            |
| import 顺序：外部库 → `@/` 别名 → 相对路径 | 组间空一行                              |
| 路径导入必须使用 `@/` 别名                 | 禁止使用 `../../../` 超过两层的相对路径 |

---

## 禁令速查表

| 禁止操作                                              | 原因                           | 正确做法                                                          |
| ----------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------- |
| 使用 Options API（`data()`, `methods`, `computed`）   | 项目统一使用 Composition API   | 使用 `<script setup lang="ts">`                                   |
| 硬编码颜色值（`#xxx`, `rgba()`）                      | 不支持暗色模式切换             | 使用 Arco CSS Token：`var(--color-bg-1)`、`rgb(var(--primary-6))` |
| 组件中直接操作 `localStorage`                         | 状态管理不统一                 | 通过 Store action 或封装的 `useXxx` hooks                         |
| 使用 `fetch` 或其他 HTTP 客户端                       | 项目统一使用 axios + 拦截器    | 使用 `axios.get/post/put/delete`                                  |
| 页面组件静态 `import`                                 | 无法路由懒加载，影响首屏性能   | 使用 `() => import('@/views/xxx/index.vue')`                      |
| 在 `views/` 根目录放页面文件                          | 破坏模块目录结构               | 放在 `views/<module>/index.vue`                                   |
| 引入 Moment.js                                        | 项目已使用 dayjs，避免重复依赖 | 使用 `dayjs`                                                      |
| 使用 `/deep/` 或 `>>>` 穿透选择器                     | Vue 3 已废弃这些语法           | 使用 `:deep(.selector)`                                           |
| 超过两层的 `../../../` 相对路径                       | 可读性差，重构易出错           | 使用 `@/` 路径别名                                                |
| 新增 `.js` 文件                                       | 项目为 TypeScript 工程         | 使用 `.ts` 或 `.vue`                                              |
| Store 外定义全局 reactive 状态                        | 状态管理混乱                   | 使用 Pinia `defineStore`                                          |
| API 文件中使用 `export default`                       | 不利于 tree-shaking 和引用追踪 | 使用具名导出 `export function fetchXxx`                           |
| `<style>` 标签不加 `scoped`                           | 样式泄漏影响全局               | 始终添加 `<style scoped lang="less">`                             |
| 模板中使用 PascalCase 属性名                          | HTML 不区分大小写              | 使用 kebab-case：`show-jumper`、`row-selection`                   |
| 引入其他 UI 组件库（Element Plus、Ant Design Vue 等） | 项目统一使用 Arco Design       | 使用 `@arco-design/web-vue` 组件                                  |

---

## Arco CSS Token 常用速查

| 用途          | Token 变量              |
| ------------- | ----------------------- |
| 页面背景      | `var(--color-bg-1)`     |
| 卡片/容器背景 | `var(--color-bg-2)`     |
| 主文字色      | `var(--color-text-1)`   |
| 次要文字色    | `var(--color-text-2)`   |
| 辅助文字色    | `var(--color-text-3)`   |
| 边框色        | `rgb(var(--gray-2))`    |
| 主色          | `rgb(var(--primary-6))` |
| 成功色        | `rgb(var(--success-6))` |
| 警告色        | `rgb(var(--warning-6))` |
| 危险色        | `rgb(var(--danger-6))`  |
| 蓝色标记      | `rgb(var(--blue-6))`    |
| 绿色标记      | `rgb(var(--green-6))`   |

---

## 自查清单

每次新增页面或组件前，确认以下要点：

- [ ] 文件放在正确的目录下（`views/<module>/`、`components/`、`api/`）
- [ ] 使用 `<script setup lang="ts">` + Composition API
- [ ] 所有颜色使用 Arco CSS Token，无硬编码色值
- [ ] `<style scoped lang="less">` 已添加
- [ ] 路由配置包含 `locale`、`requiresAuth`、`roles`
- [ ] API 函数使用具名导出 + 标准命名
- [ ] 路径导入使用 `@/` 别名
- [ ] 无 `localStorage` 直接操作
- [ ] 无 `.js` 文件、无 Options API、无 Moment.js
