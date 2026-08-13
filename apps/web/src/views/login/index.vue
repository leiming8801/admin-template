<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-blob bg-blob-1"></div>
    <div class="bg-blob bg-blob-2"></div>
    <div class="bg-blob bg-blob-3"></div>
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <img alt="logo" :src="logoUrl" style="width: 48px; height: 48px" />
        </div>
        <div class="login-brand">{{ $t('navbar.title') }}</div>
      </div>
      <LoginForm />
      <div class="login-locale">
        <a-button type="text" size="small" @click="toggleLocale">
          {{ locale === 'zh-CN' ? 'English' : '中文' }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import logoUrl from '@/assets/logo.svg?url';
  import LoginForm from './components/login-form.vue';
  import useLocale from '@/hooks/locale';
  import { useI18n } from 'vue-i18n';

  const { locale } = useI18n();
  const { changeLocale } = useLocale();

  function toggleLocale() {
    const newLocale = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
    changeLocale(newLocale);
  }
</script>

<style lang="less" scoped>
  .login-page {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(160deg, #f7f8fa 0%, #eef1f5 100%);
    overflow: hidden;
  }

  /* 两个柔和的渐变色块，缓慢漂移 */
  .bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.55;
    pointer-events: none;
    will-change: transform;
  }

  .bg-blob-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #a8c0ff 0%, transparent 70%);
    top: -150px;
    right: -100px;
    animation: drift-1 25s ease-in-out infinite;
  }

  .bg-blob-2 {
    width: 550px;
    height: 550px;
    background: radial-gradient(circle, #d4c2ef 0%, transparent 70%);
    bottom: -120px;
    left: -80px;
    animation: drift-2 30s ease-in-out infinite;
  }

  .bg-blob-3 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #b8e6d4 0%, transparent 70%);
    top: 40%;
    left: 55%;
    animation: drift-3 28s ease-in-out infinite;
  }

  @keyframes drift-1 {
    0%,
    100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(-40px, 30px);
    }
  }

  @keyframes drift-2 {
    0%,
    100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(30px, -40px);
    }
  }

  @keyframes drift-3 {
    0%,
    100% {
      transform: translate(0, 0);
    }
    50% {
      transform: translate(-25px, -30px);
    }
  }

  /* 登录卡片 */
  .login-card {
    position: relative;
    z-index: 1;
    width: 420px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.8);
    animation: card-in 0.5s ease-out;
  }

  @keyframes card-in {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .login-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .login-brand {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-1);
    letter-spacing: 1px;
  }

  .login-locale {
    text-align: center;
    margin-top: 8px;
  }
</style>
