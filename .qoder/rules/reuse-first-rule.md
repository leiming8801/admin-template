---
name: reuse-first-rule
description: 复用优先——设计/编码/调试前必须先检索记忆、文档、代码库与技能库；能复用则复用，有差异优先扩展，确认无法满足才新建；引入外部依赖或资产前先核对现场证据。
alwaysApply: true
version: 1.1
owner: 雷敏
created: 2026-11-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against: packages/shared/src、apps/web/src/components 与 utils、apps/server/src/common/utils/format.ts、.qoder/skills/web-arco-design-vue
---

# 复用优先规则

> **适用范围**：设计方案、编写代码、调试问题三类任务的启动阶段
> **加载方式**：始终加载

---

## 强制流程

| 步骤            | 要求                                                                                                                                      |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| 1 检索四处      | 记忆与知识（历史任务 / 坑点 / 架构决策）、文档（AGENTS.md / docs/ / .qoder/rules）、代码库（`packages/shared`、`src/components`、`src/utils`、`src/hooks`、server `common`）、技能库（`.qoder/skills`） |
| 2 复用前验证    | 版本以 `package.json` 实际声明为准；确认 API 未被废弃；引入外部依赖或 AI 资产前，构建文件 / AGENTS.md / 代码实际用法三者之一能证明适配才动手 |
| 3 命中判定      | 用途相同 → 直接复用；相似有差异 → 优先修复 / 扩展既有方案；无命中 → 新建并说明为何不能复用                                                  |
| 4 明确不适配时  | 有现场证据否定 → 跳过并说明证据，不回头请示；证据不足或需业务取舍 → 问用户，不猜、不先装上再说                                              |

---

## 本项目复用锚点

| 要写的东西     | 先查哪里                                                     |
| :------------- | :----------------------------------------------------------- |
| 前后端共用类型 | `packages/shared/src/*.ts`（改后需 `pnpm build` 让后端生效）  |
| 表格           | `src/components/basic-table`（禁止另起 `<a-table>`）          |
| 面包屑         | `src/components/breadcrumb`（全局注册 `Breadcrumb`）          |
| 日期格式化     | `apps/server/src/common/utils/format.ts` 的 `formatDate`      |
| 权限码 / 菜单  | `apps/server/prisma/seed.ts` 的 `permissionDefs`              |
| 弹窗 / 表单页  | `views/**/components/*-modal.vue` 既有实现                    |
| Arco 组件用法  | `.qoder/skills/web-arco-design-vue/references/`               |

---

## 禁令清单

| 禁止操作                              | 原因                       | 正确做法                   |
| :------------------------------------ | :------------------------- | :------------------------- |
| 不检索就设计新方案 / 写新代码         | 重复造轮子，与既有实现分叉 | 先执行步骤 1               |
| 相似方案有差异就另起炉灶              | 维护成本翻倍               | 先评估修复 / 扩展既有方案  |
| 绕过 BasicTable / formatDate 自己实现 | 全站样式与格式不统一       | 用既有封装                 |
| 引入新依赖前不看 package.json         | 重复依赖、版本冲突         | 核对现有依赖与版本         |
| 复用前不核对版本边界                  | 用过时 API 产生运行期错误  | 以实际依赖版本为准         |
| 拿不准是否适配就「先装上再说」        | 污染上下文、与既有规则冲突 | 证据不足则询问或跳过并说明 |
