<template>
  <div class="container">
    <Breadcrumb :items="['menu.system', 'menu.system.role']" />
    <a-card class="general-card" :title="$t('menu.system.role')">
      <a-row style="margin-bottom: 16px">
        <a-col :span="6">
          <a-input-search
            v-model="searchName"
            :placeholder="$t('system.role.search.placeholder')"
            allow-clear
            @search="handleSearch"
            @press-enter="handleSearch"
          />
        </a-col>
        <a-col :span="18" style="text-align: right">
          <a-button
            v-permission="'system:role:add'"
            type="primary"
            @click="handleAdd"
          >
            <template #icon><Plus :size="16" /></template>
            {{ $t('system.role.add') }}
          </a-button>
        </a-col>
      </a-row>

      <BasicTable
        ref="tableRef"
        :columns="columns"
        :proxy-config="proxyConfig"
      >
        <template #status="{ row }">
          <a-tag :color="row.status === 1 ? 'green' : 'gray'">
            {{
              row.status === 1
                ? $t('system.role.status.enabled')
                : $t('system.role.status.disabled')
            }}
          </a-tag>
        </template>
        <template #users="{ row }">
          <a-button
            type="text"
            size="small"
            :disabled="!row.users?.length"
            @click="handleViewUsers(row)"
          >
            {{ row.users?.length || 0 }}
          </a-button>
        </template>
        <template #action="{ row }">
          <a-space>
            <a-button
              v-permission="'system:role:edit'"
              type="text"
              size="small"
              @click="handleEdit(row)"
            >
              {{ $t('system.role.action.edit') }}
            </a-button>
            <a-button
              v-permission="'system:role:edit'"
              type="text"
              size="small"
              @click="handleAssignPermissions(row)"
            >
              {{ $t('system.role.action.assignPermissions') }}
            </a-button>
            <a-button
              v-permission="'system:role:edit'"
              type="text"
              size="small"
              :disabled="row.code === 'super_admin'"
              @click="handleToggleStatus(row)"
            >
              {{
                row.status === 1
                  ? $t('system.role.status.disabled')
                  : $t('system.role.status.enabled')
              }}
            </a-button>
            <a-popconfirm
              :content="$t('system.role.confirmDelete')"
              :disabled="row.code === 'super_admin'"
              @ok="handleDelete(row)"
            >
              <a-button
                v-permission="'system:role:delete'"
                type="text"
                status="danger"
                size="small"
                :disabled="row.code === 'super_admin'"
              >
                {{ $t('system.role.action.delete') }}
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </BasicTable>
    </a-card>

    <RoleFormModal
      v-model:visible="modalVisible"
      :edit-data="editingRole"
      @success="refreshData"
    />

    <PermissionAssignModal
      v-model:visible="permAssignVisible"
      :role-id="editingRoleId"
      @success="refreshData"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { Plus } from '@lucide/vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import type { VxeGridPropTypes } from 'vxe-table';
  import {
    fetchRoles,
    updateRole,
    deleteRole,
  } from '@/api/system';
  import type { Role } from '@admin-template/shared';
  import RoleFormModal from './components/role-form-modal.vue';
  import PermissionAssignModal from './components/permission-assign-modal.vue';

  const { t } = useI18n();
  const router = useRouter();
  const tableRef = ref();
  const searchName = ref('');

  const modalVisible = ref(false);
  const editingRole = ref<Role | null>(null);

  const permAssignVisible = ref(false);
  const editingRoleId = ref(0);

  const proxyConfig = computed<VxeGridPropTypes.ProxyConfig>(() => ({
    response: {
      result: 'list',
      total: 'total',
    },
    ajax: {
      query: async ({ page }) => {
        const result = await fetchRoles({
          page: page.currentPage,
          pageSize: page.pageSize,
          name: searchName.value || undefined,
        });
        return { list: result.list, total: result.total };
      },
    },
  }));

  const columns = computed<VxeGridPropTypes.Columns>(() => [
    { field: 'name', title: t('system.role.table.name') },
    {
      field: 'status',
      title: t('system.role.table.status'),
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'users',
      title: t('system.role.table.users'),
      align: 'center',
      slots: { default: 'users' },
    },
    {
      field: 'remark',
      title: t('system.role.table.remark'),
      showOverflow: 'tooltip',
    },
    {
      field: 'action',
      title: t('system.role.table.action'),
      width: 350,
      align: 'center',
      fixed: 'right',
      slots: { default: 'action' },
    },
  ]);

  const refreshData = () => {
    tableRef.value?.commitProxy('query');
  };

  const handleSearch = () => {
    tableRef.value?.commitProxy('reload');
  };

  const handleAdd = () => {
    editingRole.value = null;
    modalVisible.value = true;
  };

  const handleEdit = (record: Role) => {
    editingRole.value = record;
    modalVisible.value = true;
  };

  const handleAssignPermissions = (record: Role) => {
    editingRoleId.value = record.id;
    permAssignVisible.value = true;
  };

  /** 跳转到后台用户列表，并按当前角色筛选 */
  const handleViewUsers = (record: Role) => {
    router.push({
      path: '/system/admin-user',
      query: { roleId: String(record.id) },
    });
  };

  const handleToggleStatus = async (record: Role) => {
    const newStatus = record.status === 1 ? 0 : 1;
    try {
      await updateRole(record.id, { status: newStatus });
      Message.success(
        newStatus === 1
          ? t('system.role.status.enabled')
          : t('system.role.status.disabled'),
      );
      refreshData();
    } catch {
      // interceptor 已处理
    }
  };

  const handleDelete = async (record: Role) => {
    try {
      await deleteRole(record.id);
      Message.success(t('system.role.deleteSuccess'));
      refreshData();
    } catch {
      // interceptor 已处理
    }
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }

  .general-card {
    border-radius: 4px;
  }
</style>
