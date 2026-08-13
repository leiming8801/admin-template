---
name: i18n-rule
description: 前端页面开发多语言规范，要求所有用户可见文案必须使用 i18n，禁止硬编码中文，确保页面支持中英文切换。
alwaysApply: true
version: 1.0
last_verified: 2026-08-11
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

| 原则                | 说明                                                                 |
| ------------------- | ------------------------------------------------------------------- |
| 禁止硬编码文案       | 所有用户可见的文本必须通过 i18n 函数调用，禁止直接写中文字符串        |
| 双语 locale 文件     | 每个业务模块必须同时提供 `zh-CN.ts` 和 `en-US.ts` 两个 locale 文件   |
| 模块化 key 前缀     | i18n key 必须以模块名为前缀，如 `system.role.table.name`             |
| 聚合导入             | locale 文件必须在 `src/locale/zh-CN.ts` 和 `en-US.ts` 中导入并展开   |
| 响应式校验消息       | 表单 `rules` 中的校验消息必须用 `computed` 包裹，跟随语言切换         |

---

## locale 文件

| 必须遵守                                                    | 说明                                           |
| ----------------------------------------------------------- | ---------------------------------------------- |
| 每个页面模块必须在 `views/<module>/locale/` 下创建 locale  | 如 `views/system/role/locale/zh-CN.ts`         |
| 必须同时创建 `zh-CN.ts` 和 `en-US.ts`                       | 缺一不可，两个文件的 key 必须完全对应            |
| locale key 以模块名为前缀                                   | 如 `system.role.table.name`、`system.permission.form.code` |
| locale 文件导出格式为 `export default { 'key': 'value' }`  | key 用字符串，value 为对应语言的翻译             |
| 必须在 `src/locale/zh-CN.ts` 中导入并展开                   | `import localeXxx from '@/views/xxx/locale/zh-CN'` + `...localeXxx` |
| 必须在 `src/locale/en-US.ts` 中导入并展开                   | 同上，对应英文文件                               |

---

## 模板中使用

| 必须遵守                                            | 说明                                                |
| --------------------------------------------------- | --------------------------------------------------- |
| 模板中所有文案使用 `$t('key')`                      | 如 `<span>{{ $t('system.role.add') }}</span>`        |
| Arco 组件属性绑定文案使用动态绑定                   | 如 `:title="$t('...')"`、`:placeholder="$t('...')"`  |
| 禁止 `title="中文"` 这种静态字符串                  | 必须改为 `:title="$t('key')"`                        |
| 条件文案使用三元表达式 + `$t()`                    | 如 `record.status === 1 ? $t('a') : $t('b')`        |

---

## Script 中使用

| 必须遵守                                            | 说明                                                |
| --------------------------------------------------- | --------------------------------------------------- |
| 导入 `useI18n` 并获取 `t` 函数                      | `import { useI18n } from 'vue-i18n'` + `const { t } = useI18n()` |
| script 中文案使用 `t('key')`                        | 如 `Message.success(t('system.role.deleteSuccess'))`|
| 表单 `rules` 必须用 `computed` 包裹                | 因为 `t()` 是响应式的，需要 `computed` 确保语言切换时更新 |
| `computed` 中返回的对象需标注 `Record` 类型          | 如 `computed<Record<number, string>>(() => ({...}))` |

---

## key 命名规范

| 规则                          | 示例                                           |
| ----------------------------- | ---------------------------------------------- |
| 以模块名开头                  | `system.role.*`、`system.permission.*`         |
| 用点号分层                    | `system.role.table.name`                       |
| 表格列名用 `table` 前缀       | `system.role.table.status`                     |
| 表单字段用 `form` 前缀        | `system.role.form.name`                        |
| 操作按钮用 `action` 前缀      | `system.role.action.edit`                      |
| 状态值用 `status` 前缀       | `system.role.status.enabled`                   |
| placeholder 用 `placeholder` 后缀 | `system.role.form.name.placeholder`        |
| 校验消息用 `required` 后缀    | `system.role.form.name.required`                |
| 成功消息用 `Success` 后缀     | `system.role.deleteSuccess`                    |

---

## 禁令速查表

| 禁止操作                              | 原因                           | 正确做法                                          |
| ------------------------------------- | ------------------------------ | ------------------------------------------------- |
| 硬编码中文字符串                      | 不支持语言切换                 | 使用 `$t('key')` 或 `t('key')`                    |
| 只创建 `zh-CN.ts` 不创建 `en-US.ts`  | 英文模式下显示 key 原文        | 两个文件必须同时创建，key 完全对应                 |
| `rules` 对象直接定义不包裹 `computed` | 语言切换后校验消息不更新       | `const rules = computed(() => ({...}))`           |
| Arco 组件用静态 `title="中文"`        | 不支持语言切换                 | `:title="$t('key')"`                              |
| locale 文件未在聚合文件中导入          | i18n 找不到 key，显示原文       | 在 `src/locale/zh-CN.ts` 中 `import` + `...展开`  |
| locale key 不加模块前缀               | key 冲突，难以维护             | `system.role.table.name` 而非 `table.name`        |

---

## 自查清单

每次新增或修改页面前，确认以下要点：

- [ ] 所有用户可见文案已替换为 `$t()` / `t()` 调用
- [ ] `views/<module>/locale/zh-CN.ts` 和 `en-US.ts` 已创建且 key 对应
- [ ] locale 文件已在 `src/locale/zh-CN.ts` 和 `en-US.ts` 中导入并展开
- [ ] 表单 `rules` 用 `computed` 包裹
- [ ] Arco 组件的 `title`、`placeholder`、`content` 等属性用动态绑定 `:xxx="$t('...')"`
- [ ] Message/Notification 等提示消息使用 `t()` 而非硬编码
- [ ] 条件文案（如状态标签）使用三元 + `$t()` 而非硬编码
