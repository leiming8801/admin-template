<template>
  <a-modal
    :visible="visible"
    :title="editData ? $t('system.role.form.edit') : $t('system.role.form.add')"
    :width="520"
    :mask-closable="false"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <a-form-item field="name" :label="$t('system.role.form.name')">
        <a-input
          v-model="formData.name"
          :placeholder="$t('system.role.form.name.placeholder')"
          :max-length="50"
        />
      </a-form-item>
      <a-form-item
        field="code"
        :label="$t('system.role.form.code')"
        :extra="!editData ? $t('system.role.form.code.extra') : undefined"
      >
        <a-input
          v-model="formData.code"
          :placeholder="$t('system.role.form.code.placeholder')"
          :max-length="50"
          :disabled="!!editData"
        />
      </a-form-item>
      <a-form-item field="sort" :label="$t('system.role.form.sort')">
        <a-input-number
          v-model="formData.sort"
          :placeholder="$t('system.role.form.sort.placeholder')"
          :min="0"
          style="width: 100%"
        />
      </a-form-item>
      <a-form-item field="status" :label="$t('system.role.form.status')">
        <a-select v-model="formData.status">
          <a-option :value="1">{{ $t('system.role.status.enabled') }}</a-option>
          <a-option :value="0">{{ $t('system.role.status.disabled') }}</a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="remark" :label="$t('system.role.form.remark')">
        <a-textarea
          v-model="formData.remark"
          :placeholder="$t('system.role.form.remark.placeholder')"
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
  import { createRole, updateRole } from '@/api/system';
  import type { Role } from '@admin-template/shared';

  const { t } = useI18n();

  const props = defineProps<{
    visible: boolean;
    editData: Role | null;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'success'): void;
  }>();

  const formRef = ref();
  const formData = reactive({
    name: '',
    code: '',
    sort: 0,
    status: 1,
    remark: '',
  });

  const rules = computed(() => ({
    name: [{ required: true, message: t('system.role.form.name.required') }],
  }));

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        if (props.editData) {
          Object.assign(formData, {
            name: props.editData.name,
            code: props.editData.code,
            sort: props.editData.sort,
            status: props.editData.status,
            remark: props.editData.remark || '',
          });
        } else {
          Object.assign(formData, {
            name: '',
            code: '',
            sort: 0,
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
        await updateRole(props.editData.id, formData);
        Message.success(t('system.role.form.editSuccess'));
      } else {
        await createRole(formData);
        Message.success(t('system.role.form.createSuccess'));
      }
      emit('success');
      emit('update:visible', false);
    } catch {
      // interceptor 已处理
    }
  };
</script>
