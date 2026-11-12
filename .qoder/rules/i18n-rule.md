---
name: i18n-rule
description: 前端页面多语言规范——所有用户可见文案必须走 i18n，禁止硬编码中文，locale 双语文案与聚合导入必须同步。新增或修改 apps/web 页面、组件、表单校验消息时使用。
alwaysApply: true
version: 1.2
owner: 雷敏
created: 2026-08-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against:
  - 'vue-i18n ^9.10.0'
  - 'vue ^3.4.0'
  - '@arco-design/web-vue ^2.55.0'
---

# 前端页面开发多语言规范

> **适用范围**：`apps/web` 项目中所有新增、修改的前端页面和组件
> **加载方式**：始终加载

---

## 核心原则

| # | 原则          | 说明                                                                  |
| :- | :------------ | :-------------------------------------------------------------------- |
| 1 | 禁止硬编码文案 | 所有用户可见文本必须通过 `$t()` / `t()`，禁止直接写中文字符串          |
| 2 | 双语 locale    | 每个模块同时提供 `locale/zh-CN.ts` 与 `locale/en-US.ts`，key 完全对应   |
| 3 | 模块前缀       | key 以模块名开头，如 `system.role.table.name`                          |
| 4 | 聚合导入       | locale 必须在 `src/locale/zh-CN.ts` 与 `en-US.ts` 中 `import` + `...展开` |
| 5 | 响应式校验     | 表单 `rules` 用 `computed` 包裹，语言切换后消息才会更新                 |

---

## 落地要求

| 位置        | 必须                                                                                    |
| :---------- | :-------------------------------------------------------------------------------------- |
| locale 文件 | `views/<module>/locale/` 下建 `zh-CN.ts` + `en-US.ts`，格式 `export default { 'key': 'value' }` |
| 模板        | `{{ $t('key') }}`；组件属性用 `:title="$t('key')"`、`:placeholder="$t('key')"`，禁止静态 `title="中文"` |
| script      | `const { t } = useI18n()`，提示语用 `Message.success(t('...'))`                          |
| rules       | `const rules = computed(() => ({ name: [{ required: true, message: t('...') }] }))`      |
| 条件文案    | 三元 + `$t()`，如 `record.status === 1 ? $t('a') : $t('b')`                              |

---

## key 命名规范

| 规则                       | 示例                             |
| :------------------------- | :------------------------------- |
| 以模块名开头               | `system.role.*`、`system.permission.*` |
| 点号分层                   | `system.role.table.name`         |
| 表格列用 `table` 前缀      | `system.role.table.status`       |
| 表单字段用 `form` 前缀     | `system.role.form.name`          |
| 操作按钮用 `action` 前缀   | `system.role.action.edit`        |
| 状态值用 `status` 前缀     | `system.role.status.enabled`     |
| placeholder 用 `placeholder` 后缀 | `system.role.form.name.placeholder` |
| 校验消息用 `required` 后缀 | `system.role.form.name.required` |
| 成功消息用 `Success` 后缀  | `system.role.deleteSuccess`      |

---

## 禁令清单

| 禁止操作                              | 原因                     | 正确做法                               |
| :------------------------------------ | :----------------------- | :------------------------------------- |
| 硬编码中文字符串                      | 不支持语言切换           | `$t('key')` 或 `t('key')`              |
| 只建 `zh-CN.ts` 不建 `en-US.ts`       | 英文模式显示 key 原文    | 两个文件同时创建，key 完全对应         |
| `rules` 直接定义不包 `computed`       | 切换语言后校验消息不更新 | `computed(() => ({...}))`              |
| Arco 组件用静态 `title="中文"`        | 不支持语言切换           | `:title="$t('key')"`                   |
| locale 未在聚合文件中导入             | i18n 找不到 key，显示原文 | `import` + `...展开` 到两个聚合文件    |
| locale key 不加模块前缀               | key 冲突，难以维护       | `system.role.table.name` 而非 `table.name` |
| Message / Notification 直接写中文     | 提示语不随语言切换       | `t('system.role.deleteSuccess')`       |
