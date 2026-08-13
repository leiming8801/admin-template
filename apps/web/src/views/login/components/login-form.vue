<template>
  <div class="login-form">
    <div class="login-form-error-msg">{{ errorMessage }}</div>
    <a-form
      ref="loginForm"
      :model="userInfo"
      layout="vertical"
      @submit="handleSubmit"
    >
      <a-form-item
        field="username"
        :label="$t('login.form.userName.label')"
        :rules="[{ required: true, message: $t('login.form.userName.errMsg') }]"
        :validate-trigger="['change', 'blur']"
      >
        <a-input
          v-model="userInfo.username"
          :placeholder="$t('login.form.userName.placeholder')"
          size="large"
        />
      </a-form-item>
      <a-form-item
        field="password"
        :label="$t('login.form.password.label')"
        :rules="[{ required: true, message: $t('login.form.password.errMsg') }]"
        :validate-trigger="['change', 'blur']"
      >
        <a-input-password
          v-model="userInfo.password"
          :placeholder="$t('login.form.password.placeholder')"
          size="large"
          allow-clear
        />
      </a-form-item>
      <a-button
        type="primary"
        html-type="submit"
        long
        size="large"
        :loading="loading"
        class="login-btn"
      >
        {{ $t('login.form.login') }}
      </a-button>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { Message } from '@arco-design/web-vue';
  import { ValidatedError } from '@arco-design/web-vue/es/form/interface';
  import { useI18n } from 'vue-i18n';
  import { useStorage } from '@vueuse/core';
  import { useUserStore } from '@/store';
  import useLoading from '@/hooks/loading';
  import type { LoginData } from '@/api/user';
  import { DEFAULT_ROUTE } from '@/router/constants';

  const router = useRouter();
  const { t } = useI18n();
  const errorMessage = ref('');
  const { loading, setLoading } = useLoading();
  const userStore = useUserStore();

  const loginConfig = useStorage('login-config', {
    rememberPassword: true,
    username: '',
    password: '',
  });
  const userInfo = reactive({
    username: loginConfig.value.username,
    password: loginConfig.value.password,
  });

  const handleSubmit = async ({
    errors,
    values,
  }: {
    errors: Record<string, ValidatedError> | undefined;
    values: Record<string, any>;
  }) => {
    if (loading.value) return;
    if (!errors) {
      setLoading(true);
      try {
        await userStore.login(values as LoginData);
        const { redirect, ...othersQuery } = router.currentRoute.value.query;
        // redirect 可能是 route name（路由守卫传入）或 URL path（axios 拦截器传入）
        if (typeof redirect === 'string' && redirect.startsWith('/')) {
          router.push(redirect);
        } else {
          // 使用 path 导航而非 name，避免动态路由未注册时 name 匹配失败
          router.push({
            path: DEFAULT_ROUTE.fullPath,
            query: { ...othersQuery },
          });
        }
        const { rememberPassword } = loginConfig.value;
        const { username, password } = values;
        loginConfig.value.username = rememberPassword ? username : '';
        loginConfig.value.password = rememberPassword ? password : '';
      } catch (err) {
        errorMessage.value = '';
      } finally {
        setLoading(false);
      }
    }
  };
</script>

<style lang="less" scoped>
  .login-form {
    &-title {
      color: #1d2129;
      font-weight: 700;
      font-size: 24px;
      line-height: 32px;
    }

    &-subtitle {
      color: #86909c;
      font-size: 14px;
      line-height: 22px;
      margin-bottom: 24px;
    }

    &-error-msg {
      height: 24px;
      color: rgb(var(--red-6));
      font-size: 13px;
      line-height: 24px;
    }
  }

  .forgot-link {
    font-size: 13px;
    color: #86909c;
  }

  .login-btn {
    margin-top: 8px;
    height: 42px;
    font-size: 15px;
    border-radius: 6px;
  }
</style>
