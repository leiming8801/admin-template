<template>
  <div class="dashboard-container">
    <a-card class="welcome-card">
      <div class="welcome-content">
        <a-avatar :size="64" :style="{ backgroundColor: '#3370ff' }">
          {{ userStore.nickname?.charAt(0) || 'A' }}
        </a-avatar>
        <div class="welcome-text">
          <h2>{{ $t('menu.dashboard') }}</h2>
          <p>{{ greeting }}{{ userStore.nickname || userStore.username }}</p>
        </div>
      </div>
    </a-card>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="6" v-for="card in statCards" :key="card.title">
        <a-card>
          <div class="stat-card">
            <div class="stat-icon" :style="{ background: card.bgColor }">
              <icon-user-group v-if="card.icon === 'role'" />
              <icon-user v-else-if="card.icon === 'adminUser'" />
              <icon-settings v-else-if="card.icon === 'permission'" />
              <icon-user-group v-else />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.title }}</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, onMounted } from 'vue';
  import { useUserStore } from '@/store';
  import { useI18n } from 'vue-i18n';
  import { getDashboardStats } from '@/api/dashboard';

  const userStore = useUserStore();
  const { t, locale } = useI18n();

  const stats = ref({
    adminUserCount: 0,
    roleCount: 0,
    permissionCount: 0,
    memberCount: 0,
  });

  const greeting = computed(() => {
    const hour = new Date().getHours();
    if (locale.value === 'zh-CN') {
      if (hour < 6) return '凌晨好，';
      if (hour < 9) return '早上好，';
      if (hour < 12) return '上午好，';
      if (hour < 14) return '中午好，';
      if (hour < 18) return '下午好，';
      return '晚上好，';
    }
    if (hour < 12) return 'Good morning, ';
    if (hour < 18) return 'Good afternoon, ';
    return 'Good evening, ';
  });

  const statCards = computed(() => [
    {
      title: t('menu.system.role'),
      value: stats.value.roleCount,
      icon: 'role',
      bgColor: 'rgb(var(--blue-1))',
    },
    {
      title: t('menu.system.adminUser'),
      value: stats.value.adminUserCount,
      icon: 'adminUser',
      bgColor: 'rgb(var(--green-1))',
    },
    {
      title: t('menu.system.permission'),
      value: stats.value.permissionCount,
      icon: 'permission',
      bgColor: 'rgb(var(--orange-1))',
    },
    {
      title: t('menu.member'),
      value: stats.value.memberCount,
      icon: 'member',
      bgColor: 'rgb(var(--purple-1))',
    },
  ]);

  onMounted(async () => {
    try {
      const res = await getDashboardStats();
      if (res.data) {
        stats.value = res.data;
      }
    } catch {
      // 静默处理，保留默认值 0
    }
  });
</script>

<style scoped lang="less">
  .dashboard-container {
    padding: 20px;
  }

  .welcome-card {
    border-radius: 4px;
  }

  .welcome-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .welcome-text {
    h2 {
      margin: 0 0 4px;
      color: var(--color-text-1);
    }

    p {
      margin: 0;
      color: var(--color-text-3);
    }
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    font-size: 24px;
    color: var(--color-text-1);
  }

  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text-1);
    }

    .stat-label {
      font-size: 13px;
      color: var(--color-text-3);
    }
  }
</style>
