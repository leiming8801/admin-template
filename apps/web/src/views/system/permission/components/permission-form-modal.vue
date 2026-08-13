<template>
  <a-modal
    :visible="visible"
    :title="editData ? $t('system.permission.form.edit') : $t('system.permission.form.add')"
    :width="580"
    :mask-closable="false"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form ref="formRef" :model="formData" :rules="rules" layout="vertical">
      <a-form-item field="name" :label="$t('system.permission.form.name')">
        <a-input
          v-model="formData.name"
          :placeholder="$t('system.permission.form.name.placeholder')"
          :max-length="100"
        />
        <template #extra>
          <span style="color: var(--color-text-3); font-size: 12px">
            {{ $t('system.permission.form.name.extra') }}
          </span>
        </template>
      </a-form-item>
      <a-form-item field="type" :label="$t('system.permission.form.type')">
        <a-select v-model="formData.type">
          <a-option :value="1">{{ $t('system.permission.type.menu') }}</a-option>
          <a-option :value="2">{{ $t('system.permission.type.button') }}</a-option>
          <a-option :value="3">{{ $t('system.permission.type.api') }}</a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="permission" :label="$t('system.permission.form.code')">
        <a-input
          v-model="formData.permission"
          :placeholder="$t('system.permission.form.code.placeholder')"
          :max-length="100"
        />
      </a-form-item>
      <template v-if="formData.type === 1">
        <a-form-item field="path" :label="$t('system.permission.form.path')">
          <a-input
            v-model="formData.path"
            :placeholder="$t('system.permission.form.path.placeholder')"
            :max-length="200"
          />
        </a-form-item>
        <a-form-item field="component" :label="$t('system.permission.form.component')">
          <a-input
            v-model="formData.component"
            :placeholder="$t('system.permission.form.component.placeholder')"
            :max-length="200"
          />
        </a-form-item>
        <a-form-item field="icon" :label="$t('system.permission.form.icon')">
          <a-input
            v-model="formData.icon"
            :placeholder="$t('system.permission.form.icon.placeholder')"
            :max-length="50"
          />
        </a-form-item>
        <a-form-item field="visible" :label="$t('system.permission.form.visible')">
          <a-select v-model="formData.visible">
            <a-option :value="1">{{ $t('system.permission.visible.show') }}</a-option>
            <a-option :value="0">{{ $t('system.permission.visible.hide') }}</a-option>
          </a-select>
        </a-form-item>
      </template>
      <a-form-item field="sort" :label="$t('system.permission.form.sort')">
        <a-input-number
          v-model="formData.sort"
          :placeholder="$t('system.permission.form.sort.placeholder')"
          :min="0"
          style="width: 100%"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch, computed } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { createPermission, updatePermission } from '@/api/system';
  import type { Permission } from '@admin-template/shared';

  const { t } = useI18n();

  const props = defineProps<{
    visible: boolean;
    editData: Permission | null;
    parentId: number;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'success'): void;
  }>();

  const formRef = ref();
  const formData = reactive({
    parentId: 0,
    name: '',
    type: 1,
    permission: '',
    path: '',
    component: '',
    icon: '',
    sort: 0,
    visible: 1,
  });

  const rules = computed(() => ({
    name: [{ required: true, message: t('system.permission.form.name.required') }],
    type: [{ required: true, message: t('system.permission.form.type.required') }],
  }));

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        if (props.editData) {
          Object.assign(formData, {
            parentId: props.editData.parentId,
            name: props.editData.name,
            type: props.editData.type,
            permission: props.editData.permission || '',
            path: props.editData.path || '',
            component: props.editData.component || '',
            icon: props.editData.icon || '',
            sort: props.editData.sort,
            visible: props.editData.visible,
          });
        } else {
          Object.assign(formData, {
            parentId: props.parentId,
            name: '',
            type: 1,
            permission: '',
            path: '',
            component: '',
            icon: '',
            sort: 0,
            visible: 1,
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
      const payload = {
        ...formData,
        permission: formData.permission || undefined,
        path: formData.path || undefined,
        component: formData.component || undefined,
        icon: formData.icon || undefined,
      };
      if (props.editData) {
        await updatePermission(props.editData.id, payload);
        Message.success(t('system.permission.form.editSuccess'));
      } else {
        await createPermission(payload);
        Message.success(t('system.permission.form.createSuccess'));
      }
      emit('success');
      emit('update:visible', false);
    } catch {
      // interceptor 已处理
    }
  };
</script>
