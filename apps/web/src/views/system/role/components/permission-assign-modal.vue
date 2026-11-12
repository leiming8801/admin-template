<template>
  <a-modal
    :visible="visible"
    :title="$t('system.role.assign.title')"
    :width="680"
    :mask-closable="false"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <div v-if="loading" style="text-align: center; padding: 40px 0">
      <a-spin :tip="$t('system.role.assign.loading')" />
    </div>
    <template v-else>
      <a-space direction="vertical" fill style="width: 100%">
        <a-typography-text type="secondary">
          {{ $t('system.role.assign.tip') }}
        </a-typography-text>
        <a-input-search
          v-model="keyword"
          :placeholder="$t('system.role.assign.search.placeholder')"
          allow-clear
        />
        <div class="assign-toolbar">
          <a-checkbox
            :model-value="allChecked"
            :indeterminate="partChecked"
            @change="handleToggleAll"
          >
            {{ $t('system.role.assign.checkAll') }}
          </a-checkbox>
          <a-button type="text" size="mini" @click="handleToggleExpand">
            {{
              expandedAll
                ? $t('system.role.assign.collapseAll')
                : $t('system.role.assign.expandAll')
            }}
          </a-button>
          <span class="assign-count">
            {{ $t('system.role.assign.selected', { count: checkedKeys.length }) }}
          </span>
        </div>
        <div class="assign-tree">
          <a-tree
            :checked-keys="visibleCheckedKeys"
            v-model:expanded-keys="expandedKeys"
            :data="treeDataForTree"
            :field-names="{ key: 'id', title: 'label', children: 'children' }"
            checkable
            :check-strictly="true"
            @update:checked-keys="handleCheckedChange"
          >
            <template #title="node">
              <span class="perm-node">
                <span>{{ node.label }}</span>
                <a-tag v-if="node.type === 2" size="small" color="orange">
                  {{ $t('system.permission.type.button') }}
                </a-tag>
                <span v-if="node.code" class="perm-node__code">
                  {{ node.code }}
                </span>
              </span>
            </template>
          </a-tree>
          <a-empty v-if="!treeDataForTree.length" />
        </div>
      </a-space>
    </template>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import {
    fetchPermissionTree,
    fetchRoleById,
    assignRolePermissions,
  } from '@/api/system';
  import type { Permission } from '@admin-template/shared';
  import { usePermissionLabel } from '@/hooks/permission';
  import { filterPermissionTree } from '@/utils/permission';

  /** a-tree 节点数据 */
  interface PermissionTreeNode {
    id: number;
    label: string;
    type: number;
    code?: string;
    children?: PermissionTreeNode[];
  }

  const { t } = useI18n();
  const labelOf = usePermissionLabel();

  const props = defineProps<{
    visible: boolean;
    roleId: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'success'): void;
  }>();

  const loading = ref(false);
  const keyword = ref('');
  const treeData = ref<Permission[]>([]);
  /** 全量已选权限 id（可能包含被搜索过滤掉、当前不可见的节点） */
  const checkedKeys = ref<number[]>([]);
  const expandedKeys = ref<number[]>([]);

  /** 权限树转为 a-tree 节点（名称取 i18n 翻译，缺失时回退原始值） */
  const toTreeNodes = (nodes: Permission[]): PermissionTreeNode[] =>
    nodes.map((node) => ({
      id: node.id,
      label: labelOf(node.name),
      type: node.type,
      code: node.permission,
      children: node.children?.length ? toTreeNodes(node.children) : undefined,
    }));

  const treeDataForTree = computed(() =>
    toTreeNodes(
      filterPermissionTree(treeData.value, keyword.value, (node) =>
        [labelOf(node.name), node.name, node.permission, node.path]
          .filter(Boolean)
          .join(' '),
      ),
    ),
  );

  /** 当前过滤结果中可见的节点 id */
  const visibleIdSet = computed(() => {
    const ids = new Set<number>();
    const walk = (nodes: PermissionTreeNode[]) => {
      nodes.forEach((node) => {
        ids.add(node.id);
        if (node.children) walk(node.children);
      });
    };
    walk(treeDataForTree.value);
    return ids;
  });

  /**
   * 绑定到树的选中值：只回显当前过滤结果中可见的节点，
   * 被搜索隐藏的选中项由 handleCheckedChange 保留
   */
  const visibleCheckedKeys = computed(() =>
    checkedKeys.value.filter((id) => visibleIdSet.value.has(id)),
  );

  /** 全量权限树的父子关系（不受搜索过滤影响） */
  const relations = computed(() => {
    const parents = new Map<number, number>();
    const children = new Map<number, number[]>();
    const walk = (nodes: Permission[], parentId?: number) => {
      nodes.forEach((node) => {
        if (parentId !== undefined) parents.set(node.id, parentId);
        const childIds = node.children?.map((child) => child.id) ?? [];
        if (childIds.length) children.set(node.id, childIds);
        if (node.children?.length) walk(node.children, node.id);
      });
    };
    walk(treeData.value);
    return { parents, children };
  });

  /** 递归收集某个节点的所有子级 id */
  const collectDescendantIds = (id: number): number[] => {
    const result: number[] = [];
    const stack = [...(relations.value.children.get(id) ?? [])];
    while (stack.length) {
      const current = stack.pop() as number;
      result.push(current);
      stack.push(...(relations.value.children.get(current) ?? []));
    }
    return result;
  };

  /** 补齐祖先节点：授予子页面/按钮权限时自动带上其上级菜单 */
  const withAncestors = (ids: number[]): number[] => {
    const result = new Set(ids);
    ids.forEach((id) => {
      let parent = relations.value.parents.get(id);
      while (parent !== undefined) {
        result.add(parent);
        parent = relations.value.parents.get(parent);
      }
    });
    return [...result];
  };

  /**
   * 勾选联动：
   * - 勾选子项时自动勾选所有上级菜单，避免出现「只有菜单没有页面」的空白页
   * - 取消父级时级联取消其所有子级，保证父子状态一致
   */
  const handleCheckedChange = (keys: (string | number)[]) => {
    const visible = visibleIdSet.value;
    const prev = checkedKeys.value;
    // 可见部分以树组件回传的为准，被搜索隐藏的已选项原样保留
    const next = new Set<number>(prev.filter((id) => !visible.has(id)));
    keys.forEach((id) => next.add(Number(id)));

    // 取消勾选：级联取消子级（含被搜索隐藏的子节点）
    prev
      .filter((id) => visible.has(id) && !next.has(id))
      .forEach((id) => {
        collectDescendantIds(id).forEach((child) => next.delete(child));
      });

    // 新增勾选：自动带上祖先菜单
    const added = [...next].filter((id) => !prev.includes(id));
    withAncestors(added).forEach((id) => next.add(id));

    checkedKeys.value = [...next];
  };

  const allChecked = computed(
    () =>
      visibleIdSet.value.size > 0 &&
      [...visibleIdSet.value].every((id) => checkedKeys.value.includes(id)),
  );
  const partChecked = computed(
    () =>
      !allChecked.value &&
      [...visibleIdSet.value].some((id) => checkedKeys.value.includes(id)),
  );

  const collectParentIds = (nodes: PermissionTreeNode[]): number[] =>
    nodes.flatMap((node) =>
      node.children?.length
        ? [node.id, ...collectParentIds(node.children)]
        : [],
    );

  const expandedAll = computed(() => {
    const parentIds = collectParentIds(treeDataForTree.value);
    return (
      parentIds.length > 0 &&
      parentIds.every((id) => expandedKeys.value.includes(id))
    );
  });

  watch(
    () => props.visible,
    async (val) => {
      if (val && props.roleId) {
        await loadData();
      }
    },
  );

  // 搜索时展开命中的分支，方便直接看到结果
  watch(keyword, () => {
    if (keyword.value) {
      expandedKeys.value = collectParentIds(treeDataForTree.value);
    }
  });

  const loadData = async () => {
    loading.value = true;
    try {
      const [treeRes, roleRes] = await Promise.all([
        fetchPermissionTree(),
        fetchRoleById(props.roleId),
      ]);
      keyword.value = '';
      treeData.value = treeRes;
      checkedKeys.value = withAncestors(roleRes.permissionIds || []);
      expandedKeys.value = treeData.value.map((node) => node.id);
    } catch {
      // interceptor 已处理
    } finally {
      loading.value = false;
    }
  };

  const handleToggleAll = (value: boolean | (string | number | boolean)[]) => {
    const checked = Array.isArray(value) ? value.length > 0 : value;
    const visible = [...visibleIdSet.value];
    const hidden = checkedKeys.value.filter(
      (id) => !visibleIdSet.value.has(id),
    );
    checkedKeys.value = checked ? [...hidden, ...visible] : hidden;
  };

  const handleToggleExpand = () => {
    expandedKeys.value = expandedAll.value
      ? []
      : collectParentIds(treeDataForTree.value);
  };

  const handleCancel = () => {
    emit('update:visible', false);
  };

  const handleOk = async () => {
    try {
      await assignRolePermissions(props.roleId, {
        permissionIds: checkedKeys.value,
      });
      Message.success(t('system.role.assign.success'));
      emit('success');
      emit('update:visible', false);
    } catch {
      // interceptor 已处理
    }
  };
</script>

<style scoped lang="less">
  .assign-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .assign-count {
    margin-left: auto;
    color: var(--color-text-3);
    font-size: 12px;
  }

  .assign-tree {
    height: 360px;
    padding: 8px;
    overflow: auto;
    border: 1px solid var(--color-neutral-3);
    border-radius: 4px;
  }

  .perm-node {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .perm-node__code {
    color: var(--color-text-3);
    font-size: 12px;
  }
</style>
