import { mergeConfig } from 'vite';
import baseConfig from './vite.config.base';
import configCompressPlugin from './plugin/compress';
import configVisualizerPlugin from './plugin/visualizer';
import configArcoResolverPlugin from './plugin/arcoResolver';

export default mergeConfig(
  {
    mode: 'production',
    plugins: [
      // 同时生成 gzip 和 brotli 预压缩文件，brotli 压缩率比 gzip 高 15-20%
      configCompressPlugin('gzip'),
      configCompressPlugin('brotli'),
      configVisualizerPlugin(),
      configArcoResolverPlugin(),
    ],
    esbuild: {
      // 生产环境移除 console 和 debugger 语句
      drop: ['console', 'debugger'],
      legalComments: 'none',
    },
    build: {
      // 关闭生产环境 source map
      sourcemap: false,
      // 跳过压缩大小报告，加快构建速度
      reportCompressedSize: false,
      // 使用 esbuild 压缩（比 terser 快，体积差异小）
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // 细粒度代码分割，将大型第三方库拆分为独立 chunk 以利用浏览器缓存
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia', '@vueuse/core', 'vue-i18n'],
            'arco-design': ['@arco-design/web-vue'],
            'vxe-table': ['vxe-pc-ui', 'vxe-table', 'xe-utils'],
            'echarts': ['echarts', 'vue-echarts'],
            'lodash': ['lodash'],
            'editor': ['md-editor-v3', 'marked'],
            'utils': ['dayjs', 'dompurify', 'jszip', 'sortablejs', 'query-string', 'nprogress', 'mitt'],
          },
        },
      },
      chunkSizeWarningLimit: 2000,
    },
  },
  baseConfig
);
