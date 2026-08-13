/**
 * 将 Date 格式化为 "YYYY-MM-DD HH:mm:ss" 字符串
 * 替代 toISOString() 的 "2026-08-12T07:32:24.974Z" 格式
 */
export function formatDate(date: Date): string;
export function formatDate(date: Date | null | undefined): string | undefined;
export function formatDate(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}
