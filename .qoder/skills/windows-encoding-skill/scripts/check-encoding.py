#!/usr/bin/env python3
"""
诊断文件编码状态（BOM/UTF-8/GBK/混合编码/行尾）。

检测项目:
  - 文件是否存在、是否为空
  - 是否有 UTF-8 BOM 头
  - 是否为有效 UTF-8 编码
  - 是否有 GBK 可解码但 UTF-8 不可解码的字节段（混合编码嫌疑）
  - 行尾格式（LF / CRLF / 混合）
  - 是否有孤立的 CR 控制字符

性能说明（面向数千行大文件）:
  - 非法 UTF-8 字节定位：decode(errors='surrogateescape') + 正则统计（C 引擎），
    替代逐字节循环，速度提升数十倍
  - GBK 序列 / CJK 序列统计：采样前 64KB + 编译正则（C 引擎）
  - 行尾统计：str.count / bytes.count（C 实现）

用法:
  python check-encoding.py --file <path>
  python check-encoding.py --file <path> --verbose
"""
import argparse
import os
import re
import sys

# 模块级编译正则（C 引擎），避免每次调用重复编译
_RE_GBK_SEQ = re.compile(rb'[\x81-\xfe][\x40-\xfe]')            # GBK 双字节序列
_RE_UTF8_CJK = re.compile(rb'[\xe0-\xef][\x80-\xbf][\x80-\xbf]')  # UTF-8 3 字节（CJK）
_RE_BAD_UTF8 = re.compile('[\udc80-\udcff]')                    # surrogateescape 非法字节

# 统计采样上限（64KB 足以判断编码特征，大文件性能恒定）
_SAMPLE_SIZE = 64 * 1024


def check_file(file_path: str, verbose: bool = False) -> int:
    """检查文件编码状态，返回问题数量。"""
    issues = 0

    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return 1

    file_size = os.path.getsize(file_path)
    print(f"📄 文件: {file_path}")
    print(f"  大小: {file_size} 字节")

    if file_size == 0:
        print(f"⚠️  文件为空")
        return 0

    # 读取原始字节（编码诊断必须全量；统计类检测用采样）
    with open(file_path, 'rb') as f:
        raw = f.read()

    # 检查 BOM
    print(f"  原始前 16 字节 (hex): {raw[:16].hex(' ').upper()}")

    if raw[:3] == b'\xef\xbb\xbf':
        print(f"❌ BOM 头: 存在 UTF-8 BOM (EF BB BF) — 应移除")
        issues += 1
    elif raw[:2] == b'\xff\xfe':
        print(f"❌ BOM 头: 存在 UTF-16 LE BOM (FF FE) — 编码错误")
        issues += 1
    elif raw[:2] == b'\xfe\xff':
        print(f"❌ BOM 头: 存在 UTF-16 BE BOM (FE FF) — 编码错误")
        issues += 1
    else:
        print(f"✅ BOM 头: 无 BOM")

    # 尝试以 UTF-8 解码（decode 为 C 实现）
    try:
        utf8_text = raw.decode('utf-8')
        print(f"✅ UTF-8: 可完整解码为 UTF-8")
    except UnicodeDecodeError as e:
        print(f"❌ UTF-8: 解码失败 — 位置 {e.start}-{e.end}: {e.reason}")
        issues += 1
        utf8_text = None
        # 用 surrogateescape 快速定位非法字节（decode + 正则均为 C 实现，替代逐字节循环）
        decoded_lossy = raw.decode('utf-8', errors='surrogateescape')
        bad_matches = list(_RE_BAD_UTF8.finditer(decoded_lossy))
        total_bad = len(bad_matches)
        pct = total_bad / len(raw) * 100
        print(f"  非 UTF-8 字节段: {total_bad} 处 ({pct:.1f}%)")
        if verbose and total_bad <= 20:
            for m in bad_matches:
                # surrogateescape 反向映射：U+DC00 + 原始字节值
                byte_val = ord(m.group()) - 0xDC00
                print(f"    位置约 {m.start()}: 字节 {byte_val:02X}")

    # 尝试以 GBK 解码（decode 为 C 实现）
    try:
        gbk_text = raw.decode('gbk')
        print(f"✅ GBK: 可完整解码为 GBK")

        # 如果 UTF-8 解码失败但 GBK 成功，说明很可能是 GBK 编码的文件
        if utf8_text is None:
            print(f"⚠️  可能编码: GBK（UTF-8 解码失败但 GBK 成功）")
            issues += 1
        elif utf8_text != gbk_text and len(raw) > 0:
            # 两种编码都成功但内容不同，检查是否有差异（采样对比）
            sample_size = min(_SAMPLE_SIZE, len(raw))
            utf8_sample = raw[:sample_size].decode('utf-8')
            gbk_sample = raw[:sample_size].decode('gbk')
            if utf8_sample != gbk_sample:
                print(f"⚠️  混合编码嫌疑: UTF-8 和 GBK 解码结果不同（前 {sample_size} 字节）")
                if verbose:
                    print(f"    UTF-8 解码: {repr(utf8_sample[:60])}")
                    print(f"    GBK  解码: {repr(gbk_sample[:60])}")
                issues += 1
            else:
                print(f"✅ 编码一致: UTF-8 和 GBK 解码结果相同（纯 ASCII 或兼容内容）")
    except UnicodeDecodeError:
        print(f"✅ GBK: 不可解码（非 GBK 编码，正常）")

    # 检查行尾（str.count 为 C 实现）
    if utf8_text is not None:
        lf_count = utf8_text.count('\n')
        crlf_count = utf8_text.count('\r\n')
        cr_count = utf8_text.count('\r') - crlf_count  # 孤立的 CR

        print(f"  行尾: LF={lf_count}  CRLF={crlf_count}  孤立CR={cr_count}")

        if crlf_count > 0 and lf_count > crlf_count:
            print(f"⚠️  混合行尾: 同时存在 CRLF 和 LF（修改时保持原风格，或统一为数量多者）")
            issues += 1
        elif crlf_count > 0:
            print(f"ℹ️  行尾: CRLF（修改老文件时保持此风格；仅仓库级标准化时才转 LF）")
        else:
            print(f"✅ 行尾: LF")

        if cr_count > 0:
            print(f"❌ 孤立 CR 控制字符: {cr_count} 个")
            issues += 1

        # 检查是否包含 GBK 独有字符（正则 C 引擎 + 采样，替代逐字节循环）
        # 注意：UTF-8 编码的中文字符（3 字节）和 GBK 双字节范围有重叠，
        # 仅当 CJK 3 字节序列占比低时才怀疑 GBK（正常中文 UTF-8 文件为误报）
        sample = raw[:_SAMPLE_SIZE]
        suspicious_seq = len(_RE_GBK_SEQ.findall(sample))
        if suspicious_seq > 10:
            suspicious_pct = suspicious_seq / len(sample) * 100
            # 统计有效的 UTF-8 3 字节序列（中文字符）
            utf8_cjk_count = len(_RE_UTF8_CJK.findall(sample))
            if utf8_cjk_count > suspicious_seq * 0.3:
                pass  # 正常的中文 UTF-8 文件，GBK 序列重叠为误报
            else:
                print(f"⚠️  可疑 GBK 字节序列: {suspicious_seq} 处 ({suspicious_pct:.1f}%)")
                print(f"  → 可能是 GBK 编码文件被误判为 UTF-8（混合编码）")
                issues += 1
    else:
        # UTF-8 解码失败，但 GBK 可能成功，检查行尾
        try:
            text = raw.decode('gbk')
            lf_count = text.count('\n')
            crlf_count = text.count('\r\n')
            cr_count = text.count('\r') - crlf_count
            print(f"  (GBK 解码下) 行尾: LF={lf_count}  CRLF={crlf_count}  孤立CR={cr_count}")
        except Exception:
            pass

    # 总结
    print()
    if issues == 0:
        print(f"✅ 结论: 编码正常（UTF-8 无 BOM）；行尾风格请以 check 输出为准")
    else:
        print(f"⚠️  结论: 发现 {issues} 个问题，需要修复")
        print(f"  建议: python .qoder/skills/windows-encoding-skill/scripts/fix-encoding.py --file \"{file_path}\"")

    return issues


def main():
    parser = argparse.ArgumentParser(
        description='诊断文件编码状态'
    )
    parser.add_argument(
        '--file', '-f',
        required=True,
        help='要检查的文件路径'
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='显示详细信息'
    )
    args = parser.parse_args()

    issues = check_file(args.file, verbose=args.verbose)
    sys.exit(min(issues, 1))


if __name__ == '__main__':
    main()