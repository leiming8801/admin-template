<template>
  <div class="container">
    <Breadcrumb :items="breadcrumbItems" />
    <a-card class="general-card" :bordered="false">
      <div class="empty-menu">
        <div class="empty-menu-icon">
          <Lock :size="30" />
        </div>
        <h3 class="empty-menu-title">{{ $t('empty.menu.title') }}</h3>
        <p class="empty-menu-desc">{{ $t('empty.menu.desc') }}</p>
        <div class="empty-menu-tip">
          <Info :size="14" />
          <span>{{ $t('empty.menu.tip') }}</span>
        </div>
        <a-space :size="12">
          <a-button type="primary" @click="handleReload">
            <template #icon>
              <RotateCw :size="16" />
            </template>
            {{ $t('empty.menu.reload') }}
          </a-button>
          <a-button v-if="hasDashboard" @click="gotoDashboard">
            <template #icon>
              <House :size="16" />
            </template>
            {{ $t('empty.menu.backHome') }}
          </a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { House, Info, Lock, RotateCw } from '@lucide/vue';

  // 只分配了菜单、没有分配任何子页面权限时的占位页，避免右侧内容区空白
  const route = useRoute();
  const router = useRouter();

  // 仪表盘未分配给该角色时路由不存在，此时不展示「返回首页」
  const hasDashboard = computed(() => router.hasRoute('Dashboard'));

  // 面包屑取当前路由链上的菜单 key（父子同 key 时去重），
  // 顺带提供与其他页面一致的顶部留白，避免内容顶着导航栏
  const breadcrumbItems = computed(() => {
    const keys = route.matched
      .map((item) => (item.meta?.locale as string) || '')
      .filter(Boolean);
    return [...new Set(keys)];
  });

  const handleReload = () => {
    window.location.reload();
  };

  const gotoDashboard = () => {
    router.push({ name: 'Dashboard' });
  };
</script>

<style scoped lang="less">
  .container {
    padding: 0 20px 20px 20px;
  }

  .general-card {
    border-radius: 4px;
  }

  .empty-menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 380px;
    padding: 48px 24px;
    text-align: center;
  }

  .empty-menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    margin-bottom: 20px;
    border-radius: 50%;
    color: rgb(var(--orange-6));
    background-color: rgb(var(--orange-1));
  }

  .empty-menu-title {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-1);
  }

  .empty-menu-desc {
    max-width: 460px;
    margin: 0;
    font-size: 14px;
    line-height: 22px;
    color: var(--color-text-3);
  }

  .empty-menu-tip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin: 20px 0 24px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 12px;
    line-height: 18px;
    color: var(--color-text-3);
    background-color: var(--color-fill-2);

    svg {
      flex-shrink: 0;
    }
  }
</style>
