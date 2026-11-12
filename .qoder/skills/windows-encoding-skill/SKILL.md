---
name: windows-encoding-skill
description: Windows 文件编码工具技能。提供 UTF-8 无 BOM 安全写入、编码诊断（BOM/GBK/混合编码/行尾）、混合编码修复三个脚本，配套 windows-encoding-rule 使用。文件出现乱码、需要安全写入含中文文件、或修复历史编码问题时使用。
version: 1.0
owner: 雷敏
created: 2026-11-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against: Python 3（标准库 argparse/os/re/sys），脚本已确认无项目路径依赖
---

# Windows 编码工具技能

> **定位**：本技能给"怎么做"（可执行脚本与流程）；行为禁令见 `windows-encoding-rule`。

---

## 1. 触发场景

- 文件出现乱码（中文变问号 / 方块 / 混排字符），需要诊断或修复
- 需要写入含中文的文件，要求 UTF-8 无 BOM
- 怀疑历史文件存在混合编码（UTF-8 与 GBK 混排）或行尾混杂（CRLF / LF）
- PowerShell 环境下需要替代 `Set-Content` / `Out-File` 的安全写文件方式

---

## 2. 前置检查

```powershell
Get-Command python -ErrorAction SilentlyContinue
$env:PYTHONIOENCODING='utf-8'                    # 不设会抛 UnicodeEncodeError
[Console]::OutputEncoding = [Text.Encoding]::UTF8 # 不设则中文输出在控制台变乱码
```

未安装 Python 时，直接用 Write / SearchReplace 工具改文件，不要用 shell 重定向兜底。

> 已实测坑点：只设 `PYTHONIOENCODING` 时，脚本判断正常但控制台显示为 `鉁?BOM 澶?` 这类乱码，容易被误判为文件已损坏。看到乱码先设 `[Console]::OutputEncoding` 重跑，不要急着去“修文件”。

---

## 3. 脚本速查

| 脚本                        | 用途                                                     | 调用方式                                                        |
| :-------------------------- | :------------------------------------------------------- | :-------------------------------------------------------------- |
| `scripts/write-utf8.py`     | UTF-8 无 BOM 写入；新文件 LF，老文件跟随原行尾           | `--file <path> [--content ".."] [--eol lf\|crlf\|auto]`         |
| `scripts/check-encoding.py` | 诊断编码状态（BOM / UTF-8 / GBK / 混合 / 行尾）          | `--file <path> [--verbose]`                                     |
| `scripts/fix-encoding.py`   | 修复混合编码文件（默认生成 `.bak` 备份）                 | `--file <path> [--no-backup] [--dry-run] [--lf]`                |

```powershell
python .qoder/skills/windows-encoding-skill/scripts/check-encoding.py --file "docs/系统设计文档.md"
```

---

## 4. 典型工作流

1. **诊断** → `check-encoding.py --file <path>`：看 BOM / 编码 / 混合 / 行尾检查结果与问题计数
2. **修复** → `fix-encoding.py --file <path>`：默认自动备份 `.bak`；内容敏感时先 `--dry-run` 预览
3. **写入** → `write-utf8.py --file <path> --content "..."`：安全写入含中文内容（也支持 stdin 管道）
4. **复核** → 再跑一次 `check-encoding.py`，问题计数归零才算完成

---

## 5. 注意事项

- `fix-encoding.py` 默认留 `.bak`；`--no-backup` 仅在对内容有把握时使用，用完记得清理备份
- 行尾策略：本仓 `core.autocrlf=true`、工作区为 CRLF——用 `write-utf8.py` 时显式传 `--eol crlf`，否则新文件会是 LF 并与全仓不一致
- 已被乱码二次破坏（不可逆转换）的文件无法完全恢复，写回前先看 `--dry-run`
- 修复后如果 `SearchReplace` 仍匹配不到目标文本，说明还有编码或行尾差异，继续诊断而不是反复试改

---

## 交叉引用

> - 编码禁令与强制规则 → `windows-encoding-rule`
> - PowerShell 编码 / 控制流坑点 → `powershell-skill`
