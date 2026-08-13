<template>
  <div class="container">
    <Breadcrumb :items="['menu.member', 'menu.member.list']" />
    <a-card class="general-card" :title="$t('menu.member.list')">
      <a-row :gutter="16" style="margin-bottom: 16px">
        <a-col :span="6">
          <a-input-search
            v-model="searchUsername"
            :placeholder="$t('member.search.placeholder')"
            allow-clear
            @search="handleSearch"
            @press-enter="handleSearch"
          />
        </a-col>
        <a-col :span="6">
          <a-input-search
            v-model="searchPhone"
            :placeholder="$t('member.search.phonePlaceholder')"
            allow-clear
            @search="handleSearch"
            @press-enter="handleSearch"
          />
        </a-col>
        <a-col :span="6">
          <a-select
            v-model="searchStatus"
            :placeholder="$t('member.search.status')"
            allow-clear
            @change="handleSearch"
          >
            <a-option :value="1">
              {{ $t('member.search.status.enabled') }}
            </a-option>
            <a-option :value="0">
              {{ $t('member.search.status.disabled') }}
            </a-option>
          </a-select>
        </a-col>
      </a-row>

      <BasicTable
        ref="tableRef"
        :columns="columns"
        :proxy-config="proxyConfig"
      >
        <template #avatar="{ row }">
          <a-avatar :size="32">
            {{ (row.nickname || row.username || '?').charAt(0) }}
          </a-avatar>
        </template>
        <template #gender="{ row }">
          {{ genderText(row.gender) }}
        </template>
        <template #status="{ row }">
          <a-tag :color="row.status === 1 ? 'green' : 'gray'">
            {{
              row.status === 1
                ? $t('member.status.enabled')
                : $t('member.status.disabled')
            }}
          </a-tag>
        </template>
        <template #action="{ row }">
          <a-space>
            <a-button
              v-permission="'member:edit'"
              type="text"
              size="small"
              @click="handleEdit(row)"
            >
              {{ $t('member.action.edit') }}
            </a-button>
            <a-button
              v-permission="'member:edit'"
              type="text"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{
                row.status === 1
                  ? $t('member.status.disabled')
                  : $t('member.status.enabled')
              }}
            </a-button>
            <a-popconfirm
              :content="$t('member.confirmDelete')"
              @ok="handleDelete(row)"
            >
              <a-button
                v-permission="'member:delete'"
                type="text"
                status="danger"
                size="small"
              >
                {{ $t('member.action.delete') }}
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </BasicTable>
    </a-card>

    <MemberFormModal
      v-model:visible="modalVisible"
      :edit-data="editingMember"
      @success="refreshData"
    />
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import type { VxeGridPropTypes } from 'vxe-table';
  import {
    fetchMembers,
    updateMemberStatus,
    deleteMember,
  } from '@/api/member';
  import type { Member } from '@admin-template/shared';
  import MemberFormModal from './components/member-form-modal.vue';

  const { t } = useI18n();
  const tableRef = ref();
  const searchUsername = ref('');
  const searchPhone = ref('');
  const searchStatus = ref<number | undefined>(undefined);

  const modalVisible = ref(false);
  const editingMember = ref<Member | null>(null);

  const proxyConfig = computed<VxeGridPropTypes.ProxyConfig>(() => ({
    response: {
      result: 'list',
      total: 'total',
    },
    ajax: {
      query: async ({ page }) => {
        const res = await fetchMembers({
          page: page.currentPage,
          pageSize: page.pageSize,
          username: searchUsername.value || undefined,
          phone: searchPhone.value || undefined,
          status: searchStatus.value,
        });
        return { list: res.data.list, total: res.data.total };
      },
    },
  }));

  const columns = computed<VxeGridPropTypes.Columns>(() => [
    { type: 'seq', width: 60, align: 'center' },
    {
      field: 'avatar',
      title: t('member.table.avatar'),
      width: 80,
      align: 'center',
      slots: { default: 'avatar' },
    },
    {
      field: 'username',
      title: t('member.table.username'),
      showOverflow: 'tooltip',
    },
    {
      field: 'nickname',
      title: t('member.table.nickname'),
      showOverflow: 'tooltip',
    },
    {
      field: 'phone',
      title: t('member.table.phone'),
      showOverflow: 'tooltip',
    },
    {
      field: 'email',
      title: t('member.table.email'),
      showOverflow: 'tooltip',
    },
    {
      field: 'gender',
      title: t('member.table.gender'),
      align: 'center',
      slots: { default: 'gender' },
    },
    {
      field: 'status',
      title: t('member.table.status'),
      align: 'center',
      slots: { default: 'status' },
    },
    {
      field: 'createdAt',
      title: t('member.table.createdAt'),
      showOverflow: 'tooltip',
    },
    {
      field: 'action',
      title: t('member.table.action'),
      width: 220,
      align: 'center',
      fixed: 'right',
      slots: { default: 'action' },
    },
  ]);

  const genderText = (gender?: number) => {
    if (gender === 1) return t('member.gender.male');
    if (gender === 2) return t('member.gender.female');
    return t('member.gender.unknown');
  };

  const refreshData = () => {
    tableRef.value?.commitProxy('query');
  };

  const handleSearch = () => {
    tableRef.value?.commitProxy('reload');
  };

  const handleEdit = (record: Member) => {
    editingMember.value = record;
    modalVisible.value = true;
  };

  const handleToggleStatus = async (record: Member) => {
    const newStatus = record.status === 1 ? 0 : 1;
    try {
      await updateMemberStatus(record.id, newStatus);
      Message.success(
        newStatus === 1
          ? t('member.status.enabled')
          : t('member.status.disabled'),
      );
      refreshData();
    } catch {
      // interceptor 已处理
    }
  };

  const handleDelete = async (record: Member) => {
    try {
      await deleteMember(record.id);
      Message.success(t('member.deleteSuccess'));
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
