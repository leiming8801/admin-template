#!/usr/bin/env python3
"""
修复混合编码文件，重写为纯 UTF-8 无 BOM。

修复策略（按优先级）:
  1. 尝试以 UTF-8 解码，如有 BOM 则去除 BOM 后重写
  2. UTF-8 解码失败 → 尝试以 GBK 解码 → 重写为 UTF-8
  3. 两种都失败 → decode(errors='replace') 兜底，非法字节转为 U+FFFD

行尾策略:
  默认 - Linux 强制 LF；Windows 保持原文件行尾风格（LF 保持 LF，CRLF 保持 CRLF）
  --lf - 强制转换为 LF 行尾（仓库级行尾标准化或 Linux 环境时使用）

性能说明（面向数千行大文件）:
  - 编码检测/转换均用 decode（C 实现），无纯 Python 逐字节循环
  - 行尾保持判断采样前 1MB，避免全量二次读取
  - 写后验证只读前 3 字节查 BOM + 文件大小对比，避免全量读回

自动备份原始文件（添加 .bak 后缀），可用 --no-backup 跳过。

用法:
  python fix-encoding.py --file <path>
  python fix-encoding.py --file <path> --no-backup
  python fix-encoding.py --file <path> --dry-run
  python fix-encoding.py --file <path> --lf
"""
import argparse
import os
import shutil
import sys

# 行尾判断采样上限（约 1MB）
_EOL_SAMPLE_SIZE = 1024 * 1024


def detect_encoding(raw: bytes) -> tuple:
    """检测文件编码。返回 (encoding_name, decoded_text, warnings)。"""
    warnings = []

    # 检查 BOM
    has_bom = False
    if raw[:3] == b'\xef\xbb\xbf':
        has_bom = True
        warnings.append("存在 UTF-8 BOM 头，将去除")
        raw_no_bom = raw[3:]
    elif raw[:2] == b'\xff\xfe' or raw[:2] == b'\xfe\xff':
        warnings.append("存在 UTF-16 BOM 头，将转换")
        # 尝试 UTF-16 解码（decode 为 C 实现）
        try:
            text = raw.decode('utf-16')
            return ('utf-16', text, warnings)
        except UnicodeDecodeError:
            pass
        return ('unknown', None, warnings + ["UTF-16 解码失败，无法自动修复"])
    else:
        raw_no_bom = raw

    # 尝试 UTF-8 解码（decode 为 C 实现）
    try:
        text = raw_no_bom.decode('utf-8')
        if has_bom:
            return ('utf-8-bom', text, warnings)
        return ('utf-8', text, warnings)
    except UnicodeDecodeError as e:
        warnings.append(f"UTF-8 解码失败（位置 {e.start}: {e.reason}）")

    # UTF-8 失败，尝试 GBK（decode 为 C 实现）
    try:
        text = raw_no_bom.decode('gbk')
        warnings.append("以 GBK 解码成功，将转换为 UTF-8")
        return ('gbk', text, warnings)
    except UnicodeDecodeError as e:
        warnings.append(f"GBK 解码也失败（位置 {e.start}: {e.reason}）")

    # 两种都失败，errors='replace' 快速兜底（C 实现，替代逐字节强制转换）
    warnings.append("标准解码均失败，使用 errors='replace' 兜底解码（非法字节转为 U+FFFD）")
    text = raw_no_bom.decode('utf-8', errors='replace')
    return ('forced', text, warnings)


def fix_encoding(file_path: str, backup: bool = True, dry_run: bool = False, force_lf: bool = False) -> int:
    """修复文件编码。返回 0=成功, 1=失败。"""
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}", file=sys.stderr)
        return 1

    file_size = os.path.getsize(file_path)
    print(f"📄 文件: {file_path} ({file_size} 字节)")

    if file_size == 0:
        print(f"⚠️  文件为空，无需修复")
        return 0

    # 读取原始字节（修复必须全量处理）
    with open(file_path, 'rb') as f:
        raw = f.read()

    # 检测编码
    encoding, text, warnings = detect_encoding(raw)

    print(f"🔍 检测结果: {encoding}")
    for w in warnings:
        level = '❌' if '失败' in w else ('⚠️' if '警告' in w or '强制' in w else 'ℹ️')
        print(f"  {level} {w}")

    if encoding == 'utf-8':
        # 检查行尾（str.count 为 C 实现）
        lf_count = text.count('\n')
        crlf_count = text.count('\r\n')
        cr_count = text.count('\r') - crlf_count

        if crlf_count == 0 and cr_count == 0:
            print(f"✅ 文件已是 UTF-8 无 BOM，行尾无异常，无需修复")
            return 0
        elif crlf_count > 0:
            if force_lf:
                print(f"ℹ️  行尾为 CRLF，--lf 已指定，将规范化为 LF")
            else:
                print(f"ℹ️  行尾为 CRLF，将保持原行尾（如需 LF 请加 --lf）")
        elif cr_count > 0:
            print(f"ℹ️  存在孤立 CR 字符，将清理")

    if dry_run:
        print(f"🔍 [DRY RUN] 将执行以下操作:")
        if backup:
            print(f"  1. 备份: {file_path}.bak")
        if force_lf:
            print(f"  2. 重写: {file_path} (UTF-8 无 BOM + LF)")
        else:
            print(f"  2. 重写: {file_path} (UTF-8 无 BOM，保持原行尾)")
        return 0

    # 备份
    if backup:
        bak_path = file_path + '.bak'
        try:
            shutil.copy2(file_path, bak_path)
            print(f"💾 备份已创建: {bak_path}")
        except Exception as e:
            print(f"❌ 备份失败: {e}", file=sys.stderr)
            return 1

    # 统一换行为 LF，再按目标行尾转换
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    if not force_lf:
        # 保持原行尾：以数量多者为目标行尾（采样前 1MB 判断，避免全量二次读取）
        with open(file_path, 'rb') as f:
            raw_check = f.read(_EOL_SAMPLE_SIZE)
        crlf_count = raw_check.count(b'\r\n')
        lf_count = raw_check.count(b'\n') - crlf_count
        if crlf_count > 0 and crlf_count >= lf_count:
            text = text.replace('\n', '\r\n')

    # 写入（newline='' 禁用自动换行转换，避免 CRLF 双重转换）
    try:
        with open(file_path, 'w', newline='', encoding='utf-8') as f:
            f.write(text)
    except Exception as e:
        print(f"❌ 写入失败: {e}", file=sys.stderr)
        return 1

    # 轻量验证：只读前 3 字节查 BOM + 文件大小对比，避免全量读回
    with open(file_path, 'rb') as f:
        head = f.read(3)
    if head == b'\xef\xbb\xbf':
        print(f"❌ 修复后仍有 BOM 头，请检查 Python 环境", file=sys.stderr)
        return 1

    expected_size = len(text.encode('utf-8'))  # encode 为 C 实现
    actual_size = os.path.getsize(file_path)
    if actual_size != expected_size:
        print(f"❌ 修复后文件大小 {actual_size} ≠ 预期 {expected_size}", file=sys.stderr)
        return 1

    print(f"✅ 修复完成: {file_path}")
    if encoding == 'gbk':
        print(f"  编码转换: GBK → UTF-8 无 BOM")
    elif 'bom' in encoding:
        print(f"  BOM 已移除: 重写为 UTF-8 无 BOM")
    if force_lf:
        print(f"  行尾: LF（--lf 强制）")
    else:
        # 输出实际行尾（采样判断，str.count 为 C 实现）
        with open(file_path, 'rb') as f:
            final_raw = f.read(_EOL_SAMPLE_SIZE)
        final_crlf = final_raw.count(b'\r\n')
        final_lf = final_raw.count(b'\n') - final_crlf
        if final_crlf > 0 and final_lf == 0:
            print(f"  行尾: CRLF（保持原风格）")
        elif final_lf > 0:
            print(f"  行尾: LF")
    return 0


def main():
    parser = argparse.ArgumentParser(
        description='修复混合编码文件，重写为纯 UTF-8 无 BOM（默认保持原行尾）'
    )
    parser.add_argument(
        '--file', '-f',
        required=True,
        help='要修复的文件路径'
    )
    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='不创建备份文件（默认创建 .bak 备份）'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='仅预览操作，不实际修改文件'
    )
    parser.add_argument(
        '--lf',
        action='store_true',
        default=None,
        help='强制转换为 LF 行尾；不传时按平台默认（Linux 强制 LF，Windows 保持原行尾）'
    )
    args = parser.parse_args()

    # 平台默认行尾策略：Linux 严格 LF，Windows 保持原文件行尾
    force_lf = args.lf
    if force_lf is None:
        force_lf = os.name != 'nt'

    result = fix_encoding(args.file, backup=not args.no_backup, dry_run=args.dry_run, force_lf=force_lf)
    sys.exit(result)


if __name__ == '__main__':
    main()