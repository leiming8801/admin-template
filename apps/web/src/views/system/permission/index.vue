<template>
  <div class="container">
    <Breadcrumb :items="['menu.system', 'menu.system.permission']" />
    <a-card class="general-card" :title="$t('menu.system.permission')">
      <a-row style="margin-bottom: 16px" :gutter="16">
        <a-col :span="8">
          <a-input-search
            v-model="keyword"
            :placeholder="$t('system.permission.search.placeholder')"
            allow-clear
          />
        </a-col>
        <a-col :span="16" style="text-align: right">
          <a-button
            v-permission="'system:permission:add'"
            type="primary"
            @click="handleAddRoot"
          >
            <template #icon><Plus :size="16" /></template>
            {{ $t('system.permission.add') }}
          </a-button>
        </a-col>
      </a-row>

      <BasicTable
        ref="tableRef"
        :columns="columns"
        :data="filteredTree"
        :pager="false"
        :loading="loading"
        :tree-config="{ expandAll: true }"
      >
        <template #name="{ row }">
          <span :title="row.name">{{ labelOf(row.name) }}</span>
        </template>
        <template #type="{ row }">
          <a-tag :color="typeColorMap[row.type]">
            {{ typeTextMap[row.type] }}
          </a-tag>
        </template>
        <template #visible="{ row }">
          <a-tag :color="row.visible === 1 ? 'green' : 'gray'">
            {{
              row.visible === 1
                ? $t('system.permission.visible.show')
                : $t('system.permission.visible.hide')
            }}
          </a-tag>
        </template>
        <template #action="{ row }">
          <a-space>
            <a-button
              v-permission="'system:permission:add'"
              type="text"
              size="small"
              @click="handleAddChild(row)"
            >
              {{ $t('system.permission.action.addChild') }}
            </a-button>
            <a-button
              v-permission="'system:permission:edit'"
              type="text"
              size="small"
              @click="handleEdit(row)"
            >
              {{ $t('system.permission.action.edit') }}
            </a-button>
            <a-popconfirm
              :content="$t('system.permission.confirmDelete')"
              @ok="handleDelete(row)"
            >
              <a-button
                v-permission="'system:permission:delete'"
                type="text"
                status="danger"
                size="small"
              >
                {{ $t('system.permission.action.delete') }}
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </BasicTable>
    </a-card>

    <PermissionFormModal
      v-model:visible="modalVisible"
      :edit-data="editingPermission"
      :parent-id="parentId"
      @success="fetchData"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, onMounted, computed } from 'vue';
  import { Plus } from '@lucide/vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import type { VxeGridPropTypes } from 'vxe-table';
  import {
    fetchPermissionTree,
    deletePermission,
  } from '@/api/system';
  import type { Permission } from '@admin-template/shared';
  import { usePermissionLabel } from '@/hooks/permission';
  import { filterPermissionTree } from '@/utils/permission';
  import PermissionFormModal from './components/permission-form-modal.vue';

  const { t } = useI18n();
  const labelOf = usePermissionLabel();
  const tableRef = ref();
  const loading = ref(false);
  const keyword = ref('');
  const treeData = ref<Permission[]>([]);

  /** 按关键词过滤后的权限树（匹配显示名 / 原始 key / 权限标识 / 路径） */
  const filteredTree = computed(() =>
    filterPermissionTree(treeData.value, keyword.value, (node) =>
      [labelOf(node.name), node.name, node.permission, node.path]
        .filter(Boolean)
        .join(' '),
    ),
  );
  const modalVisible = ref(false);
  const editingPermission = ref<Permission | null>(null);
  const parentId = ref(0);

  const typeTextMap = computed<Record<number, string>>(() => ({
    1: t('system.permission.type.menu'),
    2: t('system.permission.type.button'),
    3: t('system.permission.type.api'),
  }));

  const typeColorMap: Record<number, string> = {
    1: 'blue',
    2: 'orange',
    3: 'purple',
  };

  const columns = computed<VxeGridPropTypes.Columns>(() => [
    {
      field: 'name',
      title: t('system.permission.table.name'),
      treeNode: true,
      minWidth: 220,
      slots: { default: 'name' },
    },
    {
      field: 'type',
      title: t('system.permission.table.type'),
      width: 100,
      slots: { default: 'type' },
      align: 'center'
    },
    {
      field: 'permission',
      title: t('system.permission.table.code'),
      showOverflow: 'tooltip',
    },
    {
      field: 'path',
      title: t('system.permission.table.path'),
      showOverflow: 'tooltip',
    },
    {
      field: 'sort',
      title: t('system.permission.table.sort'),
      width: 80,
      align: 'center'
    },
    {
      field: 'visible',
      title: t('system.permission.table.visible'),
      align: 'center',
      width: 100,
      slots: { default: 'visible' },
    },
    {
      field: 'action',
      title: t('system.permission.table.action'),
      width: 240,
      align: 'center',
      slots: { default: 'action' },
    },
  ]);

  const fetchData = async () => {
    loading.value = true;
    try {
      const result = await fetchPermissionTree();
      treeData.value = result;
    } catch {
      // interceptor 已处理
    } finally {
      loading.value = false;
    }
  };

  const handleAddRoot = () => {
    editingPermission.value = null;
    parentId.value = 0;
    modalVisible.value = true;
  };

  const handleAddChild = (record: Permission) => {
    editingPermission.value = null;
    parentId.value = record.id;
    modalVisible.value = true;
  };

  const handleEdit = (record: Permission) => {
    editingPermission.value = record;
    parentId.value = record.parentId;
    modalVisible.value = true;
  };

  const handleDelete = async (record: Permission) => {
    try {
      await deletePermission(record.id);
      Message.success(t('system.permission.deleteSuccess'));
      fetchData();
    } catch {
      // interceptor 已处理
    }
  };

  onMounted(() => {
    fetchData();
  });
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }

  .general-card {
    border-radius: 4px;
  }
</style>
