---
name: operation-safety-rule
description: 操作安全——文件/命令/数据库操作前必检路径与影响面；危险 Shell 与 SQL/Prisma 命令清单，高危立即阻止、中危必须确认；敏感信息禁止落盘与落日志。
alwaysApply: true
version: 1.1
owner: 雷敏
created: 2026-11-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against: 根 package.json scripts、apps/server/prisma/seed.ts（幂等增量同步，无 deleteMany）、apps/server/.env
---

# 操作安全规则

> **适用范围**：所有文件、命令、数据库操作（Windows + PowerShell + pnpm + Prisma / MySQL）
> **加载方式**：始终加载

---

## 核心原则

| 原则             | 说明                                                     |
| :--------------- | :------------------------------------------------------- |
| 最小权限         | 只执行任务必需的最小操作，不顺手做"顺便优化"             |
| 知情同意         | 风险操作前告知影响面并获得确认                           |
| 不可恢复二次确认 | 删除 / 清空 / 覆盖数据必须二次确认                       |
| 边界隔离         | 操作限制在工作区 `d:\个人\后台` 内，越界先说明再执行     |
| 专用工具优先     | 删除文件用 DeleteFile 工具，禁止用 shell 命令直接删文件   |

---

## 操作前检查

| 检查项 | 不通过时 |
| :----- | :------- |
| 目标路径在工作区内（`d:\个人\后台` 及其子目录）？ | 先说明原因，得到确认再操作 |
| PowerShell 命令是否用了 `&&`？ | 改为分号 `;` 分隔 |
| 操作类型为删除 / 覆盖 / 重置？ | 先列出具体文件或数据范围，等待确认 |
| 需要执行 git 写操作？ | 仅在用户明确要求时 commit / push；禁止改 config、禁止 force push |

---

## 审批触发条件

| 场景                                           | 要求                                                                     |
| :--------------------------------------------- | :----------------------------------------------------------------------- |
| 删除文件 / 目录                                | 列出清单，等待确认                                                       |
| 覆盖已有文件（非本次任务产物）                 | 说明原内容与新内容范围                                                   |
| 修改 `.env` / `settings.json` / `package.json` | 说明变更项与影响                                                         |
| 修改 `schema.prisma`                           | 说明模型变更，以及是否需要 `db:push` / `db:generate`                     |
| 执行 `pnpm db:seed`                            | 幂等增量：按 `name` 覆盖 seed 中定义条目的字段，不删除数据；会覆盖后台手工改过的 icon / path / sort |
| 批量改动（>10 处文件或记录）                   | 说明范围与回滚方式                                                       |

---

## 危险操作清单

### Shell / 构建命令

| 等级    | 命令类型       | 示例                                                              | 处理方式 |
| :------ | :------------- | :---------------------------------------------------------------- | :------- |
| 🔴 高危 | 递归强制删除   | `rm -rf`、`Remove-Item -Recurse -Force`、`del /f /s /q`           | 立即阻止 |
| 🔴 高危 | 磁盘 / 系统破坏 | `format`、`shutdown`、`diskpart`                                  | 立即阻止 |
| 🟠 中危 | 依赖与产物重置 | `pnpm clean`、删除 `node_modules` / `dist`、`pnpm install --force` | 必须确认 |
| 🟠 中危 | 进程强杀       | `Stop-Process -Force`、`taskkill /F`                              | 必须确认 |
| 🟡 低危 | 构建 / 检查    | `pnpm build`、`pnpm lint`、`pnpm db:generate`                     | 正常执行 |

**执行规范**：避免通配符匹配未知文件；先 `Get-ChildItem` 确认目标再删；命令失败先读报错，不要靠加 `-Force` 硬过。

### 数据库命令

| 等级    | 命令                                                     | 处理方式             |
| :------ | :------------------------------------------------------- | :------------------- |
| 🔴 高危 | `DROP DATABASE` / `DROP TABLE` / `TRUNCATE TABLE`        | 立即阻止             |
| 🔴 高危 | `prisma migrate reset` / `prisma db push --force-reset`  | 立即阻止（会清库）   |
| 🟡 低危 | `pnpm db:seed`                                           | 幂等可重复执行；确认是否允许覆盖 seed 条目的 icon / path / sort |
| 🟠 中危 | `DELETE` / `UPDATE` 缺少 `WHERE`                         | 必须确认             |
| 🟠 中危 | 预计影响行数 > 100                                       | 告知影响面           |
| 🟡 低危 | `prisma generate` / `db:push`（仅新增列 / 索引）         | 正常执行             |

---

## 敏感信息保护

- `apps/server/.env` 中的 `DATABASE_URL`、`JWT_SECRET`、`JWT_REFRESH_SECRET` 属敏感项：禁止打印到输出、禁止写入文档 / 示例 / 日志、禁止作为命令行参数明文出现
- 文档与示例统一用占位值（如 `mysql://user:password@localhost:3306/db`）
- 日志与异常消息不得回显密码、token、完整连接串
- 不新增包含真实凭据的文件；`.env.example` 只放占位

---

## 禁令清单

| 禁止操作                                   | 原因                           | 正确做法                       |
| :----------------------------------------- | :----------------------------- | :----------------------------- |
| 用 shell 删文件绕过 DeleteFile             | 不可恢复、无清单               | 列清单 + DeleteFile 工具       |
| 把 seed 当「重置工具」反复跑且不核对字段                  | 会覆盖后台手工改过的 icon / path / sort | 改 seed 前确认这些字段归属谁维护 |
| 用 `--force-reset` 解决迁移报错            | 直接清库                       | 分析 drift，改 schema 或手写修复 |
| 把 `.env` 真实密钥抄进文档 / 示例          | 凭据泄露                       | 用占位值                       |
| 自行 `git commit` / `push` / 改 git config | 越权写历史                     | 仅在用户明确要求时执行         |
