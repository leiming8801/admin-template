<template>
  <a-modal
    :visible="visible"
    :title="$t('member.form.edit')"
    :width="560"
    :mask-closable="false"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <a-form ref="formRef" :model="formData" layout="vertical">
      <a-form-item field="nickname" :label="$t('member.form.nickname')">
        <a-input
          v-model="formData.nickname"
          :placeholder="$t('member.form.nickname.placeholder')"
          :max-length="50"
        />
      </a-form-item>
      <a-form-item field="phone" :label="$t('member.form.phone')">
        <a-input
          v-model="formData.phone"
          :placeholder="$t('member.form.phone.placeholder')"
          :max-length="20"
        />
      </a-form-item>
      <a-form-item field="email" :label="$t('member.form.email')">
        <a-input
          v-model="formData.email"
          :placeholder="$t('member.form.email.placeholder')"
          :max-length="100"
        />
      </a-form-item>
      <a-form-item field="gender" :label="$t('member.form.gender')">
        <a-select v-model="formData.gender">
          <a-option :value="0">
            {{ $t('member.gender.unknown') }}
          </a-option>
          <a-option :value="1">
            {{ $t('member.gender.male') }}
          </a-option>
          <a-option :value="2">
            {{ $t('member.gender.female') }}
          </a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="status" :label="$t('member.form.status')">
        <a-select v-model="formData.status">
          <a-option :value="1">
            {{ $t('member.status.enabled') }}
          </a-option>
          <a-option :value="0">
            {{ $t('member.status.disabled') }}
          </a-option>
        </a-select>
      </a-form-item>
      <a-form-item field="remark" :label="$t('member.form.remark')">
        <a-textarea
          v-model="formData.remark"
          :placeholder="$t('member.form.remark.placeholder')"
          :max-length="500"
          :auto-size="{ minRows: 2, maxRows: 4 }"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
  import { ref, reactive, watch } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import { useI18n } from 'vue-i18n';
  import { updateMember } from '@/api/member';
  import type { Member } from '@admin-template/shared';

  const { t } = useI18n();

  const props = defineProps<{
    visible: boolean;
    editData: Member | null;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
    (e: 'success'): void;
  }>();

  const formRef = ref();
  const formData = reactive({
    nickname: '',
    phone: '',
    email: '',
    gender: 0,
    status: 1,
    remark: '',
  });

  watch(
    () => props.visible,
    (val) => {
      if (val && props.editData) {
        Object.assign(formData, {
          nickname: props.editData.nickname || '',
          phone: props.editData.phone || '',
          email: props.editData.email || '',
          gender: props.editData.gender ?? 0,
          status: props.editData.status,
          remark: props.editData.remark || '',
        });
      }
    },
  );

  const handleCancel = () => {
    emit('update:visible', false);
    formRef.value?.resetFields();
  };

  const handleOk = async () => {
    if (!props.editData) return;

    try {
      await updateMember(props.editData.id, {
        nickname: formData.nickname || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        gender: formData.gender,
        status: formData.status,
        remark: formData.remark || undefined,
      });
      Message.success(t('member.form.editSuccess'));
      emit('success');
      emit('update:visible', false);
    } catch {
      // interceptor 已处理
    }
  };
</script>
