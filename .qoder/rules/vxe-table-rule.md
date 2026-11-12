---
name: vxe-table-rule
description: 表格与日期格式化规范——表格必须用 BasicTable（禁 a-table / vxe-grid），列用 field 与 slots.default，固定列必须设 width，后端日期统一 formatDate 输出 YYYY-MM-DD HH:mm:ss。新增或修改 apps/web 表格页面、列配置、proxyConfig 或 apps/server 日期字段时使用。
alwaysApply: false
version: 1.1
owner: 雷敏
created: 2026-08-12
updated: 2026-11-11
last_verified: 2026-11-11
verified_against:
  - 'vxe-pc-ui ^4.16.27'
  - 'vxe-table ^4.20.11'
  - 'xe-utils ^4.0.12'
  - 'vue ^3.4.0'
  - 'NestJS ^10.3.0'
---

# VxeTable 表格使用与日期格式化规范

> **适用范围**：`apps/web` 前端表格页面 + `apps/server` 后端 Service 层
> **加载方式**：按需加载（写表格或格式化日期前读取）

---

## 核心原则

| 原则                    | 说明                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| 禁止使用 `<a-table>`    | 所有数据表格必须使用 `<BasicTable>`（基于 vxe-grid 封装）              |
| 列配置使用 VxeTable 格式 | `field` 而非 `dataIndex`，`slots.default` 而非 `slotName`              |
| 日期后端统一格式化       | 后端 Service 返回 `YYYY-MM-DD HH:mm:ss`，禁止返回 ISO 带 T/Z 格式     |
| 固定列必须有 `width`     | `fixed: 'right'` 或 `fixed: 'left'` 的列必须显式设置 `width`           |
| 表头防换行               | BasicTable 全局已设 `showHeaderOverflow: 'tooltip'`，禁止移除          |

---

## 表格组件

| 必须遵守                                         | 说明                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| 所有数据表格必须使用 `<BasicTable>`              | 组件位于 `src/components/basic-table/index.vue`，已全局注册       |
| 禁止使用 `<a-table>` / `<a-table-column>`       | Arco 表格仅保留给非业务页面或待删除页面使用                        |
| 禁止直接使用 `<vxe-grid>` / `<vxe-table>`       | 必须通过 BasicTable 封装组件调用，统一样式与配置                    |
| BasicTable 的 `ref` 暴露方法通过 `tableRef.value` | 如 `commitProxy('query')`、`getCheckboxRecords()`                 |

---

## 列配置格式

### 字段映射对照

| Arco（禁止）         | VxeTable（必须）                          | 说明                        |
| -------------------- | ----------------------------------------- | --------------------------- |
| `dataIndex: 'name'`  | `field: 'name'`                           | 数据字段名                   |
| `slotName: 'status'` | `slots: { default: 'status' }`            | 自定义渲染插槽名             |
| `ellipsis: true`     | `showOverflow: 'tooltip'`                 | 内容溢出显示省略号+tooltip   |
| `tooltip: true`      | `showOverflow: 'tooltip'`                 | 同上                        |
| `width: 200`         | `width: 200`                              | 不变                        |
| `align: 'center'`    | `align: 'center'`                        | 不变                        |
| `fixed: 'right'`      | `fixed: 'right'` + **必须同时设 `width`** | 固定列                      |
| `sortable: true`     | `sortable: true`                          | 排序列                      |

### 特殊列类型

| 列类型          | 配置                                   | 说明                        |
| --------------- | -------------------------------------- | --------------------------- |
| 序号列          | `{ type: 'seq', width: 60 }`           | 自动生成行号，禁止用插槽手写 |
| 复选框列        | `{ type: 'checkbox', width: 60 }`      | 配合 `:checkbox-config` 使用 |
| 树形展开列      | 首列添加 `treeNode: true`              | 树形表格的展开箭头           |

---

## 数据模式

### 远程分页模式（proxyConfig）

| 必须遵守                                                   | 说明                                                  |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| `proxyConfig` 必须包含 `response` 字段映射                  | `response: { result: 'list', total: 'total' }`       |
| `query` 回调返回 `{ list: 数组, total: 数值 }`              | 禁止返回 `{ result: { list, total } }` 嵌套格式        |
| `query` 回调通过 `page.currentPage` 和 `page.pageSize` 取值 | 禁止使用外部 `page` ref                               |
| 搜索触发 `tableRef.value?.commitProxy('reload')`           | `reload` 会重置到第 1 页再查询                         |
| 刷新当前页用 `tableRef.value?.commitProxy('query')`         | `query` 保持当前页码不变                               |
| `pagerConfig` 由 BasicTable 自动配置                        | 禁止手动设置 `pagerConfig`                             |

### 本地数据模式（data）

| 必须遵守                                   | 说明                                          |
| ------------------------------------------ | --------------------------------------------- |
| 传 `:data="dataRef"` + `:pager="false"`    | 本地数据不使用 VxeTable 内置分页              |
| 需要分页时在外部添加 `<a-pagination>`       | 手动管理 `pagination` 状态和翻页回调         |
| 加载状态通过 `:loading="loading"` 传入      | BasicTable 透传给 vxe-grid                    |

### 树形模式

| 必须遵守                                           | 说明                                          |
| -------------------------------------------------- | --------------------------------------------- |
| 传 `:tree-config="{ expandAll: true }"`            | 控制树形展开                                  |
| 首列配置 `treeNode: true`                          | 展示展开/折叠箭头                             |
| 数据必须含 `children` 字段                         | VxeTable 默认识别 `children`，禁止改用其他字段名 |

---

## 自定义单元格

| 必须遵守                                          | 说明                                                |
| ------------------------------------------------- | --------------------------------------------------- |
| 插槽参数使用 `{ row }` 解构                       | 禁止使用 `{ record }`（Arco 语法）                  |
| 列配置中 `slots: { default: 'slotName' }` 命名    | 插槽名必须与 `slots.default` 值一致                 |
| 模板中 `#slotName="{ row }"`                       | 必须使用 `row` 而非 `record`                       |

---

## 样式规范

| 必须遵守                                        | 说明                                                |
| ----------------------------------------------- | --------------------------------------------------- |
| 表格颜色必须使用 Arco CSS Token                | 通过 `global.less` 的 CSS 变量映射统一管理          |
| 禁止在页面 `<style>` 中硬编码 VxeTable 颜色     | 修改颜色必须改 `global.less` 的 `--vxe-ui-*` 变量   |
| 禁止移除 BasicTable 的 `:deep()` 样式覆盖       | 去竖向边框、单元格内边距、分页器对齐等样式是全局统一的 |
| 暗色模式通过 `data-vxe-ui-theme` 属性切换      | 已在 `app store toggleTheme` 中同步，禁止手动操作    |

---

## 后端日期格式化

| 必须遵守                                                | 说明                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| 后端 Service 返回日期必须使用 `formatDate()` 函数       | 函数位于 `apps/server/src/common/utils/format.ts`          |
| 禁止使用 `.toISOString()`                               | ISO 格式含 T 和 Z，如 `2026-08-12T07:32:24.974Z`            |
| 正确格式为 `YYYY-MM-DD HH:mm:ss`                        | 如 `2026-08-12 07:32:24`                                    |
| `formatDate` 使用函数重载保证类型安全                     | 传 `Date` 返回 `string`，传 `Date \| null` 返回 `string \| undefined` |
| 所有 Service 的 `toXxxType` 方法必须替换 `toISOString()` | 包括 `createdAt`、`updatedAt`、`lastLoginAt` 等所有日期字段   |

---

## 禁令速查表

| 禁止操作                                   | 原因                                | 正确做法                                            |
| ------------------------------------------ | ----------------------------------- | --------------------------------------------------- |
| 使用 `<a-table>` / `<a-table-column>`      | 项目已统一迁移到 VxeTable            | 使用 `<BasicTable>` + `columns` 配置               |
| 使用 `dataIndex` / `slotName`              | VxeTable 不识别这些字段名           | 使用 `field` / `slots: { default: 'name' }`        |
| `query` 返回 `{ result: { list, total } }` | VxeTable 默认取 `rest.result` 作为数组，对象导致无数据 | 返回 `{ list, total }` + 配置 `response.result: 'list'` |
| 固定列不设 `width`                         | 缩小后列过窄，内容截断，表头换行    | `fixed: 'right'` 必须同时设 `width: N`             |
| 插槽用 `{ record }`                        | VxeTable 的参数是 `row` 不是 `record` | 改为 `#slotName="{ row }"`                         |
| 后端用 `.toISOString()`                    | 返回 `T...Z` 格式，前端显示原始 ISO  | 使用 `formatDate(date)`                            |
| 页面 `<style>` 中写 VxeTable 颜色           | 绕过主题变量，暗色模式失效           | 改 `global.less` 的 `--vxe-ui-*` 变量              |
| 直接用 `<vxe-grid>`                         | 绕过 BasicTable 的统一配置和样式     | 必须用 `<BasicTable>`                              |

---

## 自查清单

每次新增或修改表格页面前，确认以下要点：

- [ ] 使用 `<BasicTable>` 而非 `<a-table>` 或 `<vxe-grid>`
- [ ] 列配置使用 `field` 而非 `dataIndex`，`slots.default` 而非 `slotName`
- [ ] 固定列（`fixed`）已设置 `width`
- [ ] 自定义单元格插槽使用 `{ row }` 而非 `{ record }`
- [ ] proxyConfig 包含 `response: { result: 'list', total: 'total' }`
- [ ] `query` 回调返回 `{ list: 数组, total: 数值 }` 扁平结构
- [ ] 搜索触发 `commitProxy('reload')`，刷新触发 `commitProxy('query')`
- [ ] 后端 Service 日期字段使用 `formatDate()` 而非 `toISOString()`
- [ ] 颜色通过 `global.less` 的 CSS 变量管理，无硬编码色值
