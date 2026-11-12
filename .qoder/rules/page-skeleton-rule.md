---
name: page-skeleton-rule
description: 页面骨架统一约束（apps/web）——新增或重构含表格的页面（列表页 / 报表页 / 设置页）时使用：必须是 .container + Breadcrumb + a-card.general-card + 筛选行 + BasicTable 五段结构，弹窗拆成独立 modal 组件，禁止手写 calc(100vh) 高度与自建骨架。
alwaysApply: false
version: 1.1
owner: 雷敏
created: 2026-11-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against: views/member/index.vue、views/system/admin-user/index.vue、views/system/role/index.vue、views/system/permission/index.vue、views/system/profile/index.vue
---

# 页面骨架统一约束

> **适用范围**：`apps/web` 下新增或重构含表格的页面（列表页 / 报表页 / 设置页）
> **不适用**：登录页、404 页、工作台等非表格页
> **加载方式**：按需加载（新建页面时由 `new-page-workflow-rule` 牵引，或直接读本规则）

---

## 页面五段结构

```vue
<template>
  <div class="container">
    <Breadcrumb :items="['menu.system', 'menu.system.adminUser']" />
    <a-card class="general-card" :title="$t('menu.system.adminUser')">
      <!-- ① 筛选区 -->
      <a-row :gutter="16" style="margin-bottom: 16px">
        <a-col :span="6"><a-input-search v-model="keyword" allow-clear @search="handleSearch" /></a-col>
        <a-col :span="6" style="text-align: right"><a-button type="primary" v-permission="'xxx:add'" /></a-col>
      </a-row>
      <!-- ② 表格区 -->
      <BasicTable ref="tableRef" :columns="columns" :proxy-config="proxyConfig" />
    </a-card>
  </div>
</template>
```

| # | 段位         | 约束                                                                                 |
| :- | :----------- | :----------------------------------------------------------------------------------- |
| 1 | 根容器       | 必须是 `<div class="container">`，页面级样式写在它下面                                |
| 2 | 面包屑       | 使用全局注册的 `<Breadcrumb>`，`items` 传 i18n key 数组                               |
| 3 | 内容卡       | 必须是 `<a-card class="general-card">`，`:title` 用 `$t('menu.xxx')`                  |
| 4 | 筛选区       | `<a-row :gutter="16">` + `<a-col :span="6">`，行内 `margin-bottom: 16px`；主操作按钮放最后一个 col 并 `text-align: right` |
| 5 | 表格         | 必须是 `<BasicTable>`，用法遵循 `vxe-table-rule`（按需规则，写表格前先读）                                      |
| 6 | 页面私有子组件 | 放 `views/<模块>/<资源>/components/`，弹窗命名 `xxx-modal.vue`                     |
| 7 | 文案         | 全部走 i18n（`i18n-rule`），禁止硬编码中文                                            |

---

## 样式块沿用

`.container` / `.general-card` 的样式目前是每个页面复制一份（`padding: 0 20px 20px 20px` + 卡片圆角与表头内边距）：

- 新增页面**从同类页面复制这段样式**，保持全站一致，不要自造间距
- 要调整全站间距时，先改 `src/assets/style/global.less` 与 1 个基准页，不要逐页散改
- 颜色一律用 Arco Token（`var(--color-bg-1)`、`rgb(var(--primary-6))` 等），禁止硬编码色值

---

## 弹窗约定

- 新增 / 编辑 / 分配一律拆成 `components/xxx-modal.vue`，`props` 为 `{ visible, editData }`，通过 `emit('update:visible')` 与 `emit('success')` 回传父页
- 弹窗内表单用 `<a-form :model>` + `layout="vertical"`，校验规则用 `computed` 包裹以支持语言切换
- 弹窗样式挂载点约束见 `modal-style-rule`

---

## 禁令清单

| 禁止操作                                   | 原因                                     | 正确做法                          |
| :----------------------------------------- | :--------------------------------------- | :-------------------------------- |
| 手写 `height: calc(100vh - Npx)` 撑高度    | 与布局/滚动容器换算脆弱，刷新与切换时错位 | 交给布局容器 + `a-card` 自然撑高  |
| 自建 header / 筛选条 / 表格容器骨架        | 与全站存量页结构不一致                   | 按上面五段结构写                  |
| 把弹窗直接写在列表页模板里                 | 表单状态与页面耦合，弹窗样式易失效       | 拆 `components/xxx-modal.vue`     |
| 页面内硬编码中文文案                       | 无法切换语言                             | `$t('...')` / `t('...')`          |
| 用 `<a-table>` 替代 `<BasicTable>`         | 全站表格样式与分页行为分叉               | `<BasicTable>`                    |
| 页面私有子组件放到全局 `src/components/`   | 公共目录被单页逻辑污染                   | 放页面目录下 `components/`        |
