<template>
  <div class="container">
    <Breadcrumb :items="['menu.profile']" />
    <a-row style="margin-bottom: 16px">
      <a-col :span="24">
        <a-card :bordered="false">
          <a-space :size="54">
            <div class="avatar-section">
              <a-avatar :size="100" class="info-avatar">
                <img :src="avatarUrl" />
              </a-avatar>
              <a-button
                size="small"
                :loading="uploadingAvatar"
                @click="selectAvatar"
              >
                {{ $t('system.profile.avatarUpload') }}
              </a-button>
              <span class="avatar-tip">{{ $t('system.profile.avatarTip') }}</span>
              <input
                ref="avatarInputRef"
                class="avatar-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                @change="handleAvatarChange"
              />
            </div>
            <a-descriptions
              :data="renderData"
              :column="2"
              align="right"
              layout="inline-horizontal"
              :label-style="{
                width: '100px',
                fontWeight: 'normal',
                color: 'rgb(var(--gray-8))',
              }"
              :value-style="{
                width: '200px',
                paddingLeft: '8px',
                textAlign: 'left',
              }"
            >
              <template #label="{ label }">{{ label }} :</template>
              <template #value="{ value, data }">
                <a-tag
                  v-if="data.label === $t('system.profile.roles')"
                  :color="value === 'super_admin' ? 'red' : 'blue'"
                  size="small"
                >
                  {{ value }}
                </a-tag>
                <span v-else>{{ value }}</span>
              </template>
            </a-descriptions>
          </a-space>
        </a-card>
      </a-col>
    </a-row>
    <a-row class="wrapper">
      <a-col :span="24">
        <a-tabs default-active-key="1" type="rounded">
          <a-tab-pane key="1" :title="$t('system.profile.basicInfo')">
            <a-form
              ref="basicFormRef"
              :model="basicFormData"
              class="form"
              :label-col-props="{ span: 8 }"
              :wrapper-col-props="{ span: 16 }"
            >
              <a-form-item
                field="username"
                :label="$t('system.profile.username')"
              >
                <a-input v-model="basicFormData.username" disabled />
              </a-form-item>
              <a-form-item
                field="nickname"
                :label="$t('system.profile.nickname')"
                :rules="[{ required: true, message: $t('system.profile.nicknameRequired') }]"
              >
                <a-input
                  v-model="basicFormData.nickname"
                  :placeholder="$t('system.profile.nicknamePlaceholder')"
                />
              </a-form-item>
              <a-form-item
                field="email"
                :label="$t('system.profile.email')"
              >
                <a-input v-model="basicFormData.email" :placeholder="$t('system.profile.emailPlaceholder')" />
              </a-form-item>
              <a-form-item
                field="phone"
                :label="$t('system.profile.phone')"
              >
                <a-input v-model="basicFormData.phone" :placeholder="$t('system.profile.phonePlaceholder')" />
              </a-form-item>
              <a-form-item>
                <a-space>
                  <a-button type="primary" :loading="saving" @click="handleSaveBasic">
                    {{ $t('system.profile.save') }}
                  </a-button>
                  <a-button @click="resetBasic">{{ $t('system.profile.reset') }}</a-button>
                </a-space>
              </a-form-item>
            </a-form>
          </a-tab-pane>
          <a-tab-pane key="2" :title="$t('system.profile.changePassword')">
            <a-form
              ref="passwordFormRef"
              :model="passwordFormData"
              class="form"
              :label-col-props="{ span: 8 }"
              :wrapper-col-props="{ span: 16 }"
            >
              <a-form-item
                field="oldPassword"
                :label="$t('system.profile.oldPassword')"
                :rules="[{ required: true, message: $t('system.profile.oldPasswordRequired') }]"
              >
                <a-input-password
                  v-model="passwordFormData.oldPassword"
                  :placeholder="$t('system.profile.oldPasswordPlaceholder')"
                  allow-clear
                />
              </a-form-item>
              <a-form-item
                field="newPassword"
                :label="$t('system.profile.newPassword')"
                :rules="[
                  { required: true, message: $t('system.profile.newPasswordRequired') },
                  { minLength: 6, message: $t('system.profile.passwordMinLength') },
                ]"
              >
                <a-input-password
                  v-model="passwordFormData.newPassword"
                  :placeholder="$t('system.profile.newPasswordPlaceholder')"
                  allow-clear
                />
              </a-form-item>
              <a-form-item
                field="confirmPassword"
                :label="$t('system.profile.confirmPassword')"
                :rules="[
                  { required: true, message: $t('system.profile.confirmPasswordRequired') },
                  { validator: validateConfirmPassword },
                ]"
              >
                <a-input-password
                  v-model="passwordFormData.confirmPassword"
                  :placeholder="$t('system.profile.confirmPasswordPlaceholder')"
                  allow-clear
                />
              </a-form-item>
              <a-form-item>
                <a-space>
                  <a-button type="primary" :loading="changingPassword" @click="handleChangePassword">
                    {{ $t('system.profile.changePassword') }}
                  </a-button>
                  <a-button @click="resetPassword">{{ $t('system.profile.reset') }}</a-button>
                </a-space>
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive, computed, onMounted } from 'vue';
  import { Message } from '@arco-design/web-vue';
  import type { FormInstance } from '@arco-design/web-vue/es/form';
  import type { DescData } from '@arco-design/web-vue/es/descriptions/interface';
  import { useI18n } from 'vue-i18n';
  import { useUserStore } from '@/store';
  import { resolveAvatar } from '@/utils/avatar';
  import { updateProfile, updatePassword, uploadAvatar } from '@/api/user';
  import { redirectToLogin } from '@/api/interceptor';

  const { t } = useI18n();
  const userStore = useUserStore();
  const avatarUrl = computed(() => resolveAvatar(userStore.avatar));

  const basicFormRef = ref<FormInstance>();
  const passwordFormRef = ref<FormInstance>();
  const saving = ref(false);
  const changingPassword = ref(false);
  const uploadingAvatar = ref(false);
  const avatarInputRef = ref<HTMLInputElement>();

  const basicFormData = reactive({
    username: '',
    nickname: '',
    email: '',
    phone: '',
  });

  const passwordFormData = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const renderData = computed<DescData[]>(() => [
    { label: t('system.profile.username'), value: userStore.username || '-' },
    { label: t('system.profile.nickname'), value: userStore.nickname || '-' },
    { label: t('system.profile.roles'), value: (userStore.roles || []).join(', ') || '-' },
    { label: t('system.profile.email'), value: userStore.email || '-' },
  ]);

  const selectAvatar = () => {
    avatarInputRef.value?.click();
  };

  const handleAvatarChange = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploadingAvatar.value = true;
    try {
      await uploadAvatar(file);
      await userStore.info();
      Message.success(t('system.profile.avatarUploadSuccess'));
    } catch {
      // interceptor 已处理
    } finally {
      uploadingAvatar.value = false;
      input.value = '';
    }
  };

  const loadProfile = async () => {
    try {
      await userStore.info();
      basicFormData.username = userStore.username || '';
      basicFormData.nickname = userStore.nickname || '';
      basicFormData.email = userStore.email || '';
      basicFormData.phone = userStore.phone || '';
    } catch {
      // interceptor 已处理
    }
  };

  const handleSaveBasic = async () => {
    const res = await basicFormRef.value?.validate();
    if (res) return;
    saving.value = true;
    try {
      await updateProfile({ nickname: basicFormData.nickname });
      await userStore.info();
      Message.success(t('system.profile.saveSuccess'));
    } catch {
      // interceptor 已处理
    } finally {
      saving.value = false;
    }
  };

  const resetBasic = () => {
    basicFormData.nickname = userStore.nickname || '';
    basicFormData.email = userStore.email || '';
    basicFormData.phone = userStore.phone || '';
    basicFormRef.value?.resetFields();
  };

  const validateConfirmPassword = (
    value: string,
    callback: (error?: string) => void,
  ) => {
    if (value !== passwordFormData.newPassword) {
      callback(t('system.profile.passwordMismatch'));
    } else {
      callback();
    }
  };

  const handleChangePassword = async () => {
    const res = await passwordFormRef.value?.validate();
    if (res) return;
    changingPassword.value = true;
    try {
      await updatePassword({
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword,
      });
      Message.success(t('system.profile.passwordChanged'));
      // 后端已撤销该用户全部会话，本地直接清理并返回登录页。
      userStore.logoutCallBack();
      redirectToLogin();
    } catch {
      // interceptor 已处理
    } finally {
      changingPassword.value = false;
    }
  };

  const resetPassword = () => {
    passwordFormData.oldPassword = '';
    passwordFormData.newPassword = '';
    passwordFormData.confirmPassword = '';
    passwordFormRef.value?.resetFields();
  };

  onMounted(() => {
    loadProfile();
  });
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }

  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .avatar-tip {
    color: var(--color-text-3);
    font-size: 12px;
    white-space: nowrap;
  }

  .avatar-input {
    display: none;
  }

  .wrapper {
    padding: 20px 0 0 20px;
    min-height: 580px;
    background-color: var(--color-bg-2);
    border-radius: 4px;
  }

  .form {
    width: 540px;
    margin: 0 auto;
    padding: 20px;
  }
</style>
