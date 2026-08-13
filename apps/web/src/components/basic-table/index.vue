<template>
  <vxe-grid ref="gridRef" v-bind="bindProps">
    <template
      v-for="name in slotNames"
      :key="name"
      #[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps ?? {}" />
    </template>
  </vxe-grid>
</template>

<script lang="ts" setup>
  import { computed, ref, useSlots } from 'vue';
  import type { VxeGridProps, VxeGridPropTypes } from 'vxe-table';

  interface BasicTableProps {
    /** 列配置 */
    columns: VxeGridPropTypes.Columns;
    /** 本地数据（与 proxyConfig 二选一） */
    data?: any[];
    /** 远程数据代理配置（分页/排序等） */
    proxyConfig?: VxeGridPropTypes.ProxyConfig;
    /** 是否显示分页器，默认 true */
    pager?: boolean;
    /** 每页条数，默认 10 */
    pageSize?: number;
    /** 树形配置 */
    treeConfig?: VxeGridProps['treeConfig'];
    /** 表格高度 */
    height?: number | string;
    /** 行主键字段，默认 id */
    rowKey?: string;
    /** 内容超出显示方式，默认 tooltip */
    showOverflow?: boolean | 'tooltip' | 'title';
    /** 是否显示边框，默认 true */
    border?: boolean;
    /** 是否显示斑马纹，默认 false */
    stripe?: boolean;
    /** 加载状态（本地数据模式使用） */
    loading?: boolean;
    /** 表格尺寸密度 */
    size?: VxeGridProps['size'];
    /** 复选框配置 */
    checkboxConfig?: VxeGridProps['checkboxConfig'];
    /** 列配置（可拖拽调整宽度等） */
    columnConfig?: VxeGridProps['columnConfig'];
    /** 工具栏配置 */
    toolbarConfig?: VxeGridProps['toolbarConfig'];
  }

  const props = withDefaults(defineProps<BasicTableProps>(), {
    pager: true,
    pageSize: 10,
    rowKey: 'id',
    showOverflow: 'tooltip',
    border: true,
    stripe: false,
    loading: false,
  });

  const gridRef = ref();
  const slotNames = computed(() => Object.keys(useSlots()));

  const bindProps = computed<VxeGridProps>(() => {
    const cfg: VxeGridProps = {
      border: props.border,
      stripe: props.stripe,
      showOverflow: props.showOverflow,
      showHeaderOverflow: 'tooltip',
      rowConfig: { keyField: props.rowKey, isHover: true, isCurrent: true },
      columns: props.columns,
      loading: props.loading,
    };
    if (props.height) cfg.height = props.height;
    if (props.size) cfg.size = props.size;
    if (props.checkboxConfig) cfg.checkboxConfig = props.checkboxConfig;
    if (props.columnConfig) cfg.columnConfig = props.columnConfig;
    if (props.toolbarConfig) cfg.toolbarConfig = props.toolbarConfig;
    if (props.proxyConfig) {
      cfg.proxyConfig = props.proxyConfig;
      if (props.pager) {
        cfg.pagerConfig = {
          pageSize: props.pageSize,
          pageSizes: [10, 20, 50],
        };
      }
    } else {
      cfg.data = props.data ?? [];
    }
    if (props.treeConfig) cfg.treeConfig = props.treeConfig;
    return cfg;
  });

  defineExpose({
    /** 触发代理操作（如 query 刷新） */
    commitProxy: (...args: any[]) => gridRef.value?.commitProxy(...args),
    /** 重新加载数据 */
    reloadData: () => gridRef.value?.reloadData(),
    /** 获取当前表格全量数据 */
    getData: () => gridRef.value?.getTableData()?.fullData,
    /** 获取选中的复选框记录 */
    getCheckboxRecords: () => gridRef.value?.getCheckboxRecords(),
  });
</script>

<style scoped lang="less">
  /* 去除竖向边框，只保留横向分隔线，视觉更清爽 */
  :deep(.vxe-table--render-default.is--border) {
    .vxe-body--column,
    .vxe-header--column {
      border-right: 0;
    }
  }

  /* 表头行统一高度，调小（!important 覆盖 vxe-cell 内联 height） */
  :deep(.vxe-header--column .vxe-cell) {
    height: 38px !important;
    padding: 0 12px;
    line-height: 38px;
  }

  /* 数据行统一高度 */
  :deep(.vxe-body--column .vxe-cell) {
    height: 40px !important;
    padding: 0 12px;
    line-height: 40px;
  }

  /* 空数据提示样式 */
  :deep(.vxe-table--empty-content) {
    color: var(--color-text-3);
    padding: 32px 0;
    font-size: 14px;
  }

  /* 分页器：右对齐 + 上间距 */
  :deep(.vxe-pager) {
    height: auto;
    padding-top: 12px;

    .vxe-pager--wrapper {
      justify-content: flex-end;
    }
  }
</style>
