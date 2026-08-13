import { mergeConfig } from 'vite';
import baseConfig from './vite.config.base';

export default mergeConfig(
  {
    mode: 'development',
    server: {
      open: false,
      fs: {
        strict: true,
      },
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'axios',
        'dayjs',
        'nprogress',
        'mitt',
        'lodash',
        'query-string',
        '@arco-design/web-vue',
        '@arco-design/web-vue/es/icon',
        '@vueuse/core',
        'vue-i18n',
      ],
    },
    plugins: [],
  },
  baseConfig
);
