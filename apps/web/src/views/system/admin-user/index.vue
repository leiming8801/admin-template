<template>
  <div class="container">
    <Breadcrumb :items="['menu.system', 'menu.system.adminUser']" />
    <a-card class="general-card" :title="$t('menu.system.adminUser')">
      <a-row :gutter="16" style="margin-bottom: 16px">
        <a-col :span="6">
          <a-input-search
            v-model="searchUsername"
            :placeholder="$t('system.adminUser.search.placeholder')"
            allow-clear
            @search="handleSearch"
            @press-enter="handleSearch"
          />
        </a-col>
        <a-col :span="6">
          <a-select
            v-model="searchRoleId"
            :placeholder="$t('system.adminUser.search.role')"
            allow-clear
            @change="handleSearch"
          >
            <a-option
              v-for="role in roleOptions"
              :key="role.id"
              :value="role.id"
            >
              {{ role.name }}
            </a-option>
          </a-select>
        </a-col>
        <a-col :span="6">
          <a-select
            v-model="searchStatus"
            :placeholder="$t('system.adminUser.search.status')"
            allow-clear
            @change="handleSearch"
          >
            <a-option :value="1">
              {{ $t('system.adminUser.search.status.enabled') }}
            </a-option>
            <a-option :value="0">
              {{ $t('system.adminUser.search.status.disabled') }}
            </a-option>
          </a-select>
        </a-col>
        <a-col :span="6" style="text-align: right">
          <a-button
            v-permission="'system:user:add'"
            type="primary"
            @click="handleAdd"
          >
            <template #icon><icon-plus /></template>
            {{ $t('system.adminUser.add') }}
          </a-button>
        </a-col>
      </a-row>

      <BasicTable
        ref="tableRef"
        :columns="columns"
        :proxy-config="proxyConfig"
      >
        <template #roles="{ row }">
          <template v-if="row.roles && row.roles.length">
            <a-tag
              v-for="role in row.roles"
              :key="role.id"
              color="blue"
              style="margin-right: 4px"
            >
              {{ role.name }}
            </a-tag>
          </template>
          <span v-else style="color: var(--color-text-3)">
            {{ $t('system.adminUser.noRoles') }}
          </span>
        </template>
        <template #status="{ row }">
          <a-tag :color="row.status === 1 ? 'green' : 'gray'">
            {{
              row.status === 1
                ? $t('system.adminUser.status.enabled')
                : $t('system.adminUser.status.disabled')
            }}
          </a-tag>
        </template>
        <template #action="{ row }">
          <a-space>
            <a-button
              v-permission="'system:user:edit'"
              type="text"
              size="small"
              @click="handleEdit(row)"
            >
              {{ $t('system.adminUser.action.edit') }}
            </a-button>
            <a-button
              v-permission="'system:user:edit'"
              type="text"
              size="small"
              @click="handleAssignRoles(row)"
            >
              {{ $t('system.adminUser.action.assignRoles') }}
            </a-button>
            <a-button
              v-permission="'system:user:edit'"
              type="text"
              size="small"
              @click="handleResetPassword(row)"
            >
              {{ $t('system.adminUser.action.resetPassword') }}
            </a-button>
            <a-button
              v-permission="'system:user:edit'"
              type="text"
              size="small"
              :disabled="row.username === 'admin'"
              @click="handleToggleStatus(row)"
            >
              {{
                row.status === 1
                  ? $t('system.adminUser.status.disabled')
                  : $t('system.adminUser.status.enabled')
              }}
            </a-button>
            <a-popconfirm
              :content="$t('system.adminUser.confirmDelete')"
              :disabled="row.username === 'admin'"
              @ok="handleDelete(row)"
            >
              <a-button
                v-permission="'system:user:delete'"
                type="text"
                status="danger"
                size="small"
                :disabled="row.username === 'admin'"
              >
                {{ $t('system.adminUser.action.delete') }}
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </BasicTable>
    </a-card>

    <AdminUserFormModal
      v-model:visible="modalVisible"
      :edit-data="editingUser"
      @success="refreshData"
    />

    <RoleAssignModal
      v-model:visible="roleAssignVisible"
      :user-id="editingUserId"
      :user-name="editingUsername"
      @success="refreshData"
    />

    <ResetPasswordModal
      v-model:visible="resetPasswordVisible"
      :user-id="editingUserId"
      :user-name="editingUsername"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { useRoute } from 'vue-router';
  import type { VxeGridPropTypes } from 'vxe-table';
  import {
    fetchAdminUsers,
    updateAdminUserStatus,
    deleteAdminUser,
    fetchAllRoles,
  } from '@/api/system';
  import type { AdminUser, Role } from '@admin-template/shared';
  import AdminUserFormModal from './components/admin-user-form-modal.vue';
  import RoleAssignModal from './components/role-assign-modal.vue';
  import ResetPasswordModal from './components/reset-password-modal.vue';

  const { t } = useI18n();
  const route = useRoute();
  const tableRef = ref();
  const searchUsername = ref('');
  const searchStatus = ref<number | undefined>(undefined);
  const searchRoleId = ref<number | undefined>(undefined);
  const roleOptions = ref<Role[]>([]);

  // 支持从角色列表跳转带过来的 roleId 筛选
  // 必须在 setup 阶段同步设置，确保表格初始化自动查询时 roleId 已就绪
  // （表格子组件 mounted 早于父组件 onMounted，否则首次查询带不上 roleId）
  const queryRoleId = route.query.roleId;
  if (queryRoleId) {
    searchRoleId.value = Number(queryRoleId);
  }

  onMounted(async () => {
    // 加载角色下拉选项
    try {
      const res = await fetchAllRoles();
      roleOptions.value = res.data;
    } catch {
      // interceptor 已处理
    }
  });

  const modalVisible = ref(false);
  const editingUser = ref<AdminUser | null>(null);

  const roleAssignVisible = ref(false);
  const editingUserId = ref(0);
  const editingUsername = ref('');

  const resetPasswordVisible = ref(false);

  const proxyConfig = computed<VxeGridPropTypes.ProxyConfig>(() => ({
    response: {
      result: 'list',
      total: 'total',
    },
    ajax: {
      query: async ({ page }) => {
        const res = await fetchAdminUsers({
          page: page.currentPage,
          pageSize: page.pageSize,
          username: searchUsername.value || undefined,
          status: searchStatus.value,
          roleId: searchRoleId.value,
        });
        return { list: res.data.list, total: res.data.total };
      },
    },
  }));

  const columns = computed<VxeGridPropTypes.Columns>(() => [
    { type: 'seq', width: 60, align: 'center' },
    {
      field: 'username',
      title: t('system.adminUser.table.username'),
      width: 200,
    },
    {
      field: 'nickname',
      title: t('system.adminUser.table.nickname'),
      width: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'roles',
      title: t('system.adminUser.table.roles'),
      slots: { default: 'roles' },
    },
    {
      field: 'status',
      title: t('system.adminUser.table.status'),
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'lastLoginAt',
      title: t('system.adminUser.table.lastLoginAt'),
      showOverflow: 'tooltip',
    },
    {
      field: 'action',
      title: t('system.adminUser.table.action'),
      width: 400,
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
    editingUser.value = null;
    modalVisible.value = true;
  };

  const handleEdit = (record: AdminUser) => {
    editingUser.value = record;
    modalVisible.value = true;
  };

  const handleAssignRoles = (record: AdminUser) => {
    editingUserId.value = record.id;
    editingUsername.value = record.nickname || record.username;
    roleAssignVisible.value = true;
  };

  const handleResetPassword = (record: AdminUser) => {
    editingUserId.value = record.id;
    editingUsername.value = record.nickname || record.username;
    resetPasswordVisible.value = true;
  };

  const handleToggleStatus = async (record: AdminUser) => {
    const newStatus = record.status === 1 ? 0 : 1;
    try {
      await updateAdminUserStatus(record.id, newStatus);
      Message.success(
        newStatus === 1
          ? t('system.adminUser.status.enabled')
          : t('system.adminUser.status.disabled'),
      );
      refreshData();
    } catch {
      // interceptor 已处理
    }
  };

  const handleDelete = async (record: AdminUser) => {
    try {
      await deleteAdminUser(record.id);
      Message.success(t('system.adminUser.deleteSuccess'));
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
