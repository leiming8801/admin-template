<template>
  <a-modal
    :visible="visible"
    :title="$t('system.adminUser.assign.title')"
    :width="680"
    :mask-closable="false"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <div v-if="loading" style="text-align: center; padding: 40px 0">
      <a-spin :tip="$t('system.adminUser.assign.loading')" />
    </div>
    <template v-else>
      <a-space direction="vertical" fill style="width: 100%">
        <a-typography-text type="secondary">
          {{ $t('system.adminUser.assign.tip') }}
        </a-typography-text>
        <a-transfer
          v-model="targetValues"
          :data="transferData"
          :title="[
            $t('system.adminUser.assign.sourceTitle'),
            $t('system.adminUser.assign.targetTitle'),
          ]"
          show-search
        />
      </a-space>
    </template>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, watch, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { fetchAllRoles, fetchAdminUserById, assignAdminUserRoles } from '@/api/system';
  import type { Role } from '@admin-template/shared';

  const { t } = useI18n();

  const props = defineProps<{
    visible: boolean;
    userId: number;
    userName: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'success'): void;
  }>();

  const loading = ref(false);
  const allRoles = ref<Role[]>([]);
  const targetValues = ref<string[]>([]);

  const transferData = computed(() =>
    allRoles.value.map((r) => ({
      value: String(r.id),
      label: r.name,
      disabled: false,
    })),
  );

  watch(
    () => props.visible,
    async (val) => {
      if (val && props.userId) {
        await loadData();
      }
    },
  );

  const loadData = async () => {
    loading.value = true;
    try {
      const [rolesRes, userRes] = await Promise.all([
        fetchAllRoles(),
        fetchAdminUserById(props.userId),
      ]);
      allRoles.value = rolesRes;
      targetValues.value = (userRes.roleIds || []).map(String);
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
      await assignAdminUserRoles(props.userId, {
        roleIds: targetValues.value.map(Number),
      });
      Message.success(t('system.adminUser.assign.success'));
      emit('success');
      emit('update:visible', false);
    } catch {
      // interceptor 已处理
    }
  };
</script>
