#!/usr/bin/env python3
"""
以 UTF-8 无 BOM 写入文件内容，行尾风格可选。

Windows 上 PowerShell 的 Set-Content/Out-File 会引入 BOM 或 GBK 编码，
此脚本绕过这些问题，确保文件以纯 UTF-8 无 BOM 写入。

行尾策略（--eol）:
  lf   - 强制 LF（\n）行尾（新增文件默认；Linux 平台默认）
  crlf - 强制 CRLF（\r\n）行尾
  auto - 自动跟随原文件行尾；文件不存在时回退 LF（Windows 修改老文件默认）

平台默认（不传 --eol 时）:
  Linux   → lf（严格 LF，禁止 CRLF）
  Windows → auto（新增文件回退 LF，修改老文件跟随原行尾）

性能说明（面向数千行大文件）:
  - 换行统一用 str.replace（C 实现，O(n) 单遍）
  - 写后验证只读前 3 字节查 BOM + 文件大小对比，避免全量读回
  - 行尾检测采样前 1MB，超长单行文件才全量回退

用法:
  python write-utf8.py --file <path> --content "<content>" [--eol lf|crlf|auto]
  echo "<content>" | python write-utf8.py --file <path> [--eol auto]
  python write-utf8.py --file <path> < content.txt
  python write-utf8.py --file <path>                          # 从 stdin 读取
"""
import argparse
import os
import sys

# 行尾检测采样上限（约 1MB，足够代表数千行文件的行尾风格）
_EOL_SAMPLE_SIZE = 1024 * 1024


def _eol_style(raw: bytes) -> str:
    """根据字节内容判定行尾风格。bytes.count 为 C 实现。"""
    crlf_count = raw.count(b'\r\n')
    lf_count = raw.count(b'\n') - crlf_count
    if crlf_count > 0 and lf_count > 0:
        return 'mixed'
    if crlf_count > 0:
        return 'crlf'
    return 'lf'


def detect_existing_eol(file_path: str) -> str:
    """检测已存在文件的行尾风格，返回 'lf' / 'crlf' / 'mixed'；文件不存在返回 'lf'。"""
    if not os.path.exists(file_path):
        return 'lf'
    try:
        with open(file_path, 'rb') as f:
            raw = f.read(_EOL_SAMPLE_SIZE)
        if b'\n' not in raw:
            # 采样内无换行（超长单行文件），全量检测一次
            file_size = os.path.getsize(file_path)
            if file_size > len(raw):
                with open(file_path, 'rb') as f:
                    raw = f.read()
        return _eol_style(raw)
    except OSError:
        return 'lf'


def write_utf8(file_path: str, content: str, eol: str = 'lf') -> None:
    """以 UTF-8 无 BOM 写入文件。eol: 'lf' / 'crlf' / 'auto'。"""
    # 确定目标行尾
    if eol == 'auto':
        existing = detect_existing_eol(file_path)
        eol = 'crlf' if existing == 'crlf' else 'lf'
        mode_desc = f"auto(跟随原文件: {existing})"
    else:
        mode_desc = eol

    # 统一换行为 LF，再按目标行尾转换（str.replace 为 C 实现，O(n)）
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    if eol == 'crlf':
        content = content.replace('\n', '\r\n')

    # 创建父目录（如果不存在）
    parent = os.path.dirname(file_path)
    if parent and not os.path.exists(parent):
        os.makedirs(parent, exist_ok=True)

    # 单次写入（newline='' 禁用自动换行转换，避免 CRLF 双重转换）
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        f.write(content)

    # 轻量验证：只读前 3 字节查 BOM + 文件大小对比，避免全量读回
    with open(file_path, 'rb') as f:
        head = f.read(3)
    if head == b'\xef\xbb\xbf':
        print(f"❌ 错误：写入后文件仍有 BOM 头，请检查 Python 环境配置", file=sys.stderr)
        sys.exit(1)

    expected_size = len(content.encode('utf-8'))  # encode 为 C 实现
    actual_size = os.path.getsize(file_path)
    if actual_size != expected_size:
        print(f"⚠️  警告：文件大小 {actual_size} 字节 ≠ 预期 {expected_size} 字节（可能写入异常）",
              file=sys.stderr)

    print(f"✅ 成功写入 {len(content)} 字符到: {file_path} (行尾: {mode_desc})")


def main():
    parser = argparse.ArgumentParser(
        description='以 UTF-8 无 BOM 写入文件内容，行尾风格可选'
    )
    parser.add_argument(
        '--file', '-f',
        required=True,
        help='目标文件路径'
    )
    parser.add_argument(
        '--content', '-c',
        help='要写入的内容（可选，不提供则从 stdin 读取）'
    )
    parser.add_argument(
        '--eol',
        choices=['lf', 'crlf', 'auto'],
        default=None,
        help='行尾风格: lf / crlf / auto（跟随原文件，文件不存在回退 LF）；不传时按平台默认（Linux=lf，Windows=auto）'
    )
    args = parser.parse_args()

    # 平台默认行尾策略：Linux 严格 LF，Windows 跟随原文件
    eol = args.eol
    if eol is None:
        eol = 'lf' if os.name != 'nt' else 'auto'

    # 获取内容
    content = args.content
    if content is None:
        # 从 stdin 读取
        if sys.stdin.isatty():
            print("请输入内容（Ctrl+Z 结束，Enter 换行）：", file=sys.stderr)
        content = sys.stdin.read()

    if not content and not sys.stdin.isatty():
        # 来自管道但内容为空
        print("⚠️  警告：内容为空", file=sys.stderr)

    write_utf8(args.file, content, eol=eol)


if __name__ == '__main__':
    main()