<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="['AiChat']">
      <component :is="Component" :key="route.name === 'AiChat' ? 'AiChat' : route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<script lang="ts" setup></script>

<style scoped lang="less"></style>
