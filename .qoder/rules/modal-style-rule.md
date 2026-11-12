---
name: modal-style-rule
description: 弹窗样式挂载点约束——Arco Modal 默认 renderToBody 渲染到 body，页面根 class 不能作弹窗样式的祖先选择器；弹窗样式必须挂在弹窗组件自身或 a-modal 自身 class 上。编写或修改弹窗样式时使用。
alwaysApply: false
version: 1.0
owner: 雷敏
created: 2026-11-11
updated: 2026-11-11
last_verified: 2026-11-11
verified_against: '@arco-design/web-vue es/modal/modal.vue_vue_type_script_lang.js renderToBody default true、modal.js Teleport、views/**/components/*-modal.vue 现状'
---

# 弹窗样式挂载点约束

> **适用范围**：`apps/web` 中编写或修改 `<a-modal>` 及其内部元素的 scoped 样式
> **加载方式**：按需加载（改弹窗或弹窗样式不生效时读取）

---

## 核心规则

| # | 约束                                                                                         |
| :- | :------------------------------------------------------------------------------------------- |
| 1 | Arco `<a-modal>` 的 `renderToBody` 默认为 `true`，弹窗 DOM 被 Teleport 到 `document.body`，与页面根节点是**兄弟关系**，没有祖先链 |
| 2 | 因此页面根 class 下的弹窗选择器（`.container .xxx-form`）**整段静默失效**：编译不报错、样式就是不命中 |
| 3 | 弹窗样式必须写在**弹窗组件自身**的 `<style scoped>` 里（slot 内容仍带本组件 `data-v`，选择器能在弹窗 DOM 内部闭合），或挂在 `<a-modal class="xxx-modal">` 自身的 class 下 |
| 4 | 覆盖 Arco 内部类（`.arco-modal-header` 等）用 `:deep()`，同样只能挂在弹窗自身 class 或组件根内 |
| 5 | 修改弹窗样式不生效时，第一件事是核对挂载点，而不是逐条调选择器                          |

---

## 正确 / 错误写法

```vue
<!-- 正确：弹窗组件自己持有样式 -->
<template>
  <a-modal class="role-form-modal" :visible="visible" :width="520">…</a-modal>
</template>
<style scoped lang="less">
  .role-form-modal {
    :deep(.arco-modal-header) { border-bottom: none; }
    .form-tip { color: var(--color-text-3); }
  }
</style>
```

```vue
<!-- 错误：样式写在列表页根 class 下，弹窗被 Teleport 后匹配不到 -->
<style scoped lang="less">
  .container {
    .role-form-modal .form-tip { color: red; } /* 永不生效 */
  }
</style>
```

---

## 禁令清单

| 禁止操作                                     | 原因                                     | 正确做法                             |
| :------------------------------------------- | :--------------------------------------- | :----------------------------------- |
| 弹窗样式嵌在页面根 class 内                  | 无祖先关系，整段静默失效                 | 样式写进弹窗组件或挂 a-modal class   |
| 用 `:render-to-body="false"` 把弹窗挂回页面内 | 改变层级 / 遮罩 / 滚动行为，引入 z-index 问题 | 保持默认渲染行为，改样式挂载点       |
| 发现单条弹窗样式不生效只调该条               | 实际是挂载点错误导致整段失效             | 先核对挂载点 class 位置              |
| 在列表页给弹窗内部元素写 scoped 覆盖          | 跨组件作用域，命中不确定                 | 在弹窗组件内覆盖                     |
