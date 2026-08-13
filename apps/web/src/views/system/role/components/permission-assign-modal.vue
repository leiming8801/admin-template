<template>
  <a-modal
    :visible="visible"
    :title="$t('system.role.assign.title')"
    :width="600"
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
        <a-tree
          v-model:checked-keys="checkedKeys"
          :data="treeDataForTree"
          :field-names="{ key: 'id', title: 'name', children: 'children' }"
          checkable
          :default-expand-all="false"
          :check-strictly="false"
        />
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

  const { t } = useI18n();

  const props = defineProps<{
    visible: boolean;
    roleId: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'success'): void;
  }>();

  const loading = ref(false);
  const treeData = ref<Permission[]>([]);

  // a-tree 兼容的数据（剥离 icon 等不兼容字段）
  const treeDataForTree = computed(() => {
    const strip = (nodes: Permission[]): any[] =>
      nodes.map((n) => ({
        id: n.id,
        name: n.name,
        children: n.children?.length ? strip(n.children) : undefined,
      }));
    return strip(treeData.value);
  });
  const checkedKeys = ref<number[]>([]);

  watch(
    () => props.visible,
    async (val) => {
      if (val && props.roleId) {
        await loadData();
      }
    },
  );

  const loadData = async () => {
    loading.value = true;
    try {
      const [treeRes, roleRes] = await Promise.all([
        fetchPermissionTree(),
        fetchRoleById(props.roleId),
      ]);
      treeData.value = treeRes.data;
      checkedKeys.value = roleRes.data.permissionIds || [];
    } catch {
      // interceptor 已处理
    } finally {
      loading.value = false;
    }
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
