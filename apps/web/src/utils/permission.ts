import type { Permission } from '@admin-template/shared';

/**
 * 按关键字过滤权限树
 * - 节点自身命中：保留该节点及其完整子树（便于查看上下文）
 * - 仅子级命中：保留该节点用于定位，children 为过滤后的子级
 * - 关键字为空时原样返回
 */
export function filterPermissionTree(
  nodes: Permission[],
  keyword: string,
  getSearchText: (node: Permission) => string,
): Permission[] {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return nodes;

  const walk = (list: Permission[]): Permission[] => {
    const result: Permission[] = [];
    for (const node of list) {
      const matched = getSearchText(node).toLowerCase().includes(kw);
      if (matched) {
        result.push(node);
        continue;
      }
      const children = node.children?.length ? walk(node.children) : [];
      if (children.length) {
        result.push({ ...node, children });
      }
    }
    return result;
  };

  return walk(nodes);
}
