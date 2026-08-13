<template>
  <a-modal
    :visible="visible"
    :title="$t('system.adminUser.resetPassword.title')"
    :width="480"
    :mask-closable="false"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <a-form-item>
        <a-typography-text type="secondary">
          {{ $t('system.adminUser.resetPassword.tip', { name: userName }) }}
        </a-typography-text>
      </a-form-item>
      <a-form-item field="password" :label="$t('system.adminUser.resetPassword.password')">
        <a-input-password
          v-model="formData.password"
          :placeholder="$t('system.adminUser.resetPassword.password.placeholder')"
          :max-length="50"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { resetAdminUserPassword } from '@/api/system';

  const { t } = useI18n();

  const props = defineProps<{
    visible: boolean;
    userId: number;
    userName: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
  }>();

  const formRef = ref();
  const formData = reactive({
    password: '',
  });

  const rules = computed(() => ({
    password: [
      { required: true, message: t('system.adminUser.resetPassword.password.required') },
      { minLength: 6, message: t('system.adminUser.resetPassword.password.minLength') },
    ],
  }));

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        formData.password = '';
      }
    },
  );

  const handleCancel = () => {
    emit('update:visible', false);
    formRef.value?.resetFields();
  };

  const handleOk = async () => {
    const errors = await formRef.value?.validate();
    if (errors) return;

    try {
      await resetAdminUserPassword(props.userId, {
        password: formData.password,
      });
      Message.success(t('system.adminUser.resetPassword.success'));
      emit('update:visible', false);
    } catch {
      // interceptor 已处理
    }
  };
</script>
