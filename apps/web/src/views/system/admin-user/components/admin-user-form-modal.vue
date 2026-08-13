<template>
  <a-modal
    :visible="visible"
    :title="editData ? $t('system.adminUser.form.edit') : $t('system.adminUser.form.add')"
    :width="560"
    :mask-closable="false"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <a-form-item field="username" :label="$t('system.adminUser.form.username')">
        <a-input
          v-model="formData.username"
          :placeholder="$t('system.adminUser.form.username.placeholder')"
          :max-length="50"
          :disabled="!!editData"
        />
      </a-form-item>
      <a-form-item
        v-if="!editData"
        field="password"
        :label="$t('system.adminUser.form.password')"
      >
        <a-input-password
          v-model="formData.password"
          :placeholder="$t('system.adminUser.form.password.placeholder')"
          :max-length="50"
        />
      </a-form-item>
      <a-form-item field="nickname" :label="$t('system.adminUser.form.nickname')">
        <a-input
          v-model="formData.nickname"
          :placeholder="$t('system.adminUser.form.nickname.placeholder')"
          :max-length="50"
        />
      </a-form-item>
      <a-form-item field="email" :label="$t('system.adminUser.form.email')">
        <a-input
          v-model="formData.email"
          :placeholder="$t('system.adminUser.form.email.placeholder')"
          :max-length="100"
        />
      </a-form-item>
      <a-form-item field="phone" :label="$t('system.adminUser.form.phone')">
        <a-input
          v-model="formData.phone"
          :placeholder="$t('system.adminUser.form.phone.placeholder')"
          :max-length="20"
        />
      </a-form-item>
      <a-form-item field="status" :label="$t('system.adminUser.form.status')">
        <a-select v-model="formData.status">
          <a-option :value="1">
            {{ $t('system.adminUser.status.enabled') }}
          </a-option>
          <a-option :value="0">
            {{ $t('system.adminUser.status.disabled') }}
          </a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="remark" :label="$t('system.adminUser.form.remark')">
        <a-textarea
          v-model="formData.remark"
          :placeholder="$t('system.adminUser.form.remark.placeholder')"
          :max-length="500"
          :auto-size="{ minRows: 2, maxRows: 4 }"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { createAdminUser, updateAdminUser } from '@/api/system';
  import type { AdminUser } from '@admin-template/shared';

  const { t } = useI18n();

  const props = defineProps<{
    visible: boolean;
    editData: AdminUser | null;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'success'): void;
  }>();

  const formRef = ref();
  const formData = reactive({
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    status: 1,
    remark: '',
  });

  const rules = computed(() => ({
    username: [
      { required: true, message: t('system.adminUser.form.username.required') },
      { minLength: 2, message: t('system.adminUser.form.username.minLength') },
    ],
    password: [
      { required: true, message: t('system.adminUser.form.password.required') },
      { minLength: 6, message: t('system.adminUser.form.password.minLength') },
    ],
    nickname: [
      { required: true, message: t('system.adminUser.form.nickname.required') },
    ],
  }));

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        if (props.editData) {
          Object.assign(formData, {
            username: props.editData.username,
            password: '',
            nickname: props.editData.nickname,
            email: props.editData.email || '',
            phone: props.editData.phone || '',
            status: props.editData.status,
            remark: props.editData.remark || '',
          });
        } else {
          Object.assign(formData, {
            username: '',
            password: '',
            nickname: '',
            email: '',
            phone: '',
            status: 1,
            remark: '',
          });
        }
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
      if (props.editData) {
        await updateAdminUser(props.editData.id, {
          nickname: formData.nickname,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          status: formData.status,
          remark: formData.remark || undefined,
        });
        Message.success(t('system.adminUser.form.editSuccess'));
      } else {
        await createAdminUser({
          username: formData.username,
          password: formData.password,
          nickname: formData.nickname,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          status: formData.status,
          remark: formData.remark || undefined,
        });
        Message.success(t('system.adminUser.form.createSuccess'));
      }
      emit('success');
      emit('update:visible', false);
    } catch {
      // interceptor 已处理
    }
  };
</script>
