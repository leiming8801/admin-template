---
name: windows-encoding-rule
description: Windows 编码与命令约束——文件统一 UTF-8 无 BOM（.ps1 例外带 BOM），禁止用 Set-Content/echo 写中文，PowerShell 用分号而非 &&、用 curl.exe 与 Get-Command。
alwaysApply: true
version: 1.0
owner: 雷敏
created: 2026-11-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against: PowerShell 5.1、本仓 docs/ 与 src/ 中文文件、技能 windows-encoding-skill 三个脚本
---

# Windows 编码与命令约束

> **适用范围**：Windows 环境下的所有文件读写与命令执行操作
> **加载方式**：始终加载
> **辅助工具**：写法与脚本见技能 `windows-encoding-skill`（write-utf8 / check-encoding / fix-encoding）

---

## 核心原则

- **UTF-8 无 BOM**：所有源码、文档、JSON、.env 必须 UTF-8 无 BOM。唯一例外：`.ps1` 脚本（PowerShell 5.1 需 BOM 才能正确解析中文）
- **行尾跟随**：本仓 `core.autocrlf=true`，工作区文件为 **CRLF**；新增与修改都保持 CRLF，擅自转 LF 会产生整文件 diff。唯一例外：外部导入的只读参考资料包（`.qoder/skills/web-arco-design-vue/`）保留原始 LF，不做批量转换
- **写文件只用工具**：改文件用 Write / SearchReplace，不用 shell 重定向写内容

---

## 禁令清单

| 禁止操作                                   | 风险                          | 正确做法                                        |
| :----------------------------------------- | :---------------------------- | :---------------------------------------------- |
| `Set-Content` / `Out-File` 写含中文文件    | 默认 GBK / UTF-16，中文乱码   | 用 Write / SearchReplace 工具                   |
| `echo` / `cat >` 重定向写文件              | 编码不可控，中文乱码          | 用 Write / SearchReplace 工具                   |
| 在已乱码文件上直接 SearchReplace           | 二次破坏甚至清空              | 先 `check-encoding.py` 诊断，再 `fix-encoding.py` |
| 未设编码直接跑 Python 处理中文             | 默认 GBK，抛 UnicodeEncodeError | 先 `$env:PYTHONIOENCODING='utf-8'`             |
| 用 `&&` 连接多条命令                       | PowerShell 不识别该分隔符     | 用分号 `;`                                      |
| 用 `curl`（实为 Invoke-WebRequest 别名）   | 参数不兼容                    | 用 `curl.exe`                                   |
| 用 `which` 检测命令                        | PowerShell 无此命令           | 用 `Get-Command -ErrorAction SilentlyContinue`  |
| 中文路径不加引号                           | 空格/特殊字符导致参数错位     | 路径整体加引号                                  |

---

## 写入校验

新增或大改含中文的文件后，抽查 1~2 个文件确认编码与行尾：

```powershell
python .qoder/skills/windows-encoding-skill/scripts/check-encoding.py --file "docs/示例.md"
```

问题计数为 0 视为通过；`GetProblems` 报乱码或搜索不到中文时优先怀疑编码而非内容。
