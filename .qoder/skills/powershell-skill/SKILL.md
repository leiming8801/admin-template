---
name: powershell-skill
description: Windows PowerShell 脚本与命令陷阱指南。涵盖 UTF-8 编码、只读自动变量、$LASTEXITCODE、try/finally 与 return、分号替代 &&、curl.exe、Get-Command、进程与端口查询，以及本项目 pnpm/turbo/prisma 命令写法。在 Windows 下编写脚本或排查命令不生效时使用。
version: 1.0
owner: 雷敏
created: 2026-11-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against: Windows PowerShell 5.1、本仓根 package.json scripts、pnpm 9 / turbo 2 / Prisma 5
---

# PowerShell 脚本与命令陷阱

> **定位**：本文件给"怎么做"（写法与替代命令）；"能不能做"的禁令见 `windows-encoding-rule`。

---

## 1. 编码与文件读写

PowerShell 5.1 **必须**用 UTF-8 with BOM 才能正确解析含中文的 `.ps1`；项目数据文件（md / ts / json / .env）仍是 UTF-8 **无 BOM**。

```powershell
# 错误：默认 ANSI 读取 UTF-8，中文损坏
$content = Get-Content -Raw "file.md"

# 正确：显式指定编码
$content = Get-Content -Raw -Encoding UTF8 "file.md"
```

| 需求         | 做法                                                                 |
| :----------- | :------------------------------------------------------------------- |
| 改代码 / 文档 | 用 Write / SearchReplace 工具，不用 shell 重定向                     |
| 必须写 `.ps1` | `Out-File -Encoding UTF8` 或 `[IO.File]::WriteAllText($p,$c,[Text.UTF8Encoding]::new($true))` |
| Python 处理中文 | 先 `$env:PYTHONIOENCODING='utf-8'`                                  |

---

## 2. 变量与路径

| 陷阱                        | 说明                                                        |
| :-------------------------- | :---------------------------------------------------------- |
| `$pid`                      | 自动变量，只读，赋值抛 `SessionStateUnauthorizedAccessException`；改用 `$procId` |
| `$?` / `$_` / `$Error` / `$LASTEXITCODE` | 自动变量，禁止自定义同名变量                    |
| 双引号里的 `$`              | 会被展开；路径用单引号或反引号转义 `\`$USER``                |
| 字符串截取                  | `Substring()` 越界抛异常；先判长度或用 `Split-Path -Leaf`    |
| 路径拼接                    | 用 `Join-Path`，不要手工拼 `\`                               |
| 含空格 / 中文的路径         | 整体加引号                                                   |

---

## 3. 控制流

```powershell
# 陷阱一：try 内 return 会被 finally 干扰
function Test-Bad {
  Push-Location $root
  try { return $false } finally { Pop-Location }   # 返回值可能丢失
}

# 正确：不用 try/finally + return 组合
function Test-Good {
  $origin = Get-Location
  Set-Location $root
  $result = $false
  # …业务逻辑
  Set-Location $origin
  return $result
}
```

```powershell
# 陷阱二：try/catch 抓不到外部命令的非零退出码
try { pnpm build } catch { }        # 构建失败也不进 catch

# 正确：判断 $LASTEXITCODE
pnpm build
if ($LASTEXITCODE -ne 0) { Write-Error "构建失败，退出码 $LASTEXITCODE"; exit 1 }
```

---

## 4. 命令执行兼容

| 场景        | 错误写法                            | 正确写法                                                       |
| :---------- | :---------------------------------- | :------------------------------------------------------------- |
| 串联命令    | `pnpm build:web && pnpm build:server` | `pnpm build:web; pnpm build:server`（或用两条独立命令）       |
| HTTP 请求   | `curl -H "..." url`                 | `curl.exe -H "..." url`（`curl` 是 Invoke-WebRequest 别名）    |
| 检测命令    | `which pnpm`                        | `Get-Command pnpm -ErrorAction SilentlyContinue`               |
| 带 `=` 的参数 | `pnpm add -D vue-router@4`（多数场景可用），但 `--filter=xxx` 建议整体引号 | `pnpm --filter "@admin-template/server" build` |
| node 单行脚本 | `node -e 'console.log(1)'`        | `node -e "console.log(1)"`                                     |
| 输出静默    | `$p.CloseMainWindow()`              | `$null = $p.CloseMainWindow()`                                 |

---

## 5. 进程与端口

```powershell
# 非管理员下 Get-Process 的 CommandLine 为空，必须走 WMI
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select-Object ProcessId, CommandLine

# 查端口占用（3000 后端 / 5173 前端）
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
  Select-Object LocalPort, State, OwningProcess

# 结束进程：先优雅后强杀
$p = Get-Process -Id $procId -ErrorAction SilentlyContinue
if ($p) { $null = $p.CloseMainWindow(); Start-Sleep -Milliseconds 300; if (-not $p.HasExited) { $p.Kill() } }
```

---

## 6. 本项目常用命令

```powershell
# 依赖与开发
pnpm install
pnpm dev:server; pnpm dev:web          # 两个终端分别启动，或直接 pnpm dev

# 构建与检查（注意分号）
pnpm build
pnpm lint

# 数据库
pnpm db:generate
pnpm db:push
pnpm db:seed                            # 会清空并重建权限表，执行前先告知影响

# 单包过滤
pnpm --filter "@admin-template/server" dev
```

> `pnpm db:seed` 属中危操作，见 `operation-safety-rule`；`prisma migrate reset` / `db push --force-reset` 属高危，禁止自行执行。

---

## 7. 自查清单

- [ ] `.ps1` 文件保存为 UTF-8 with BOM；数据文件仍无 BOM
- [ ] `Get-Content` 带 `-Encoding UTF8`
- [ ] 没有把 `$pid` / `$_` / `$?` 当普通变量
- [ ] 外部命令失败判断用 `$LASTEXITCODE`
- [ ] 多条命令用 `;` 而不是 `&&`
- [ ] 命令存在性用 `Get-Command` 判断
- [ ] 方法返回值用 `$null =` 静默
- [ ] 路径含空格 / 中文时加引号
