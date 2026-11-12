import { createApp } from 'vue';
import ArcoVue from '@arco-design/web-vue';
import VxeUIAll, { VxeUI } from 'vxe-pc-ui';
import 'vxe-pc-ui/es/style.css';
import VxeUITable from 'vxe-table';
import 'vxe-table/es/style.css';
import zhCN from 'vxe-pc-ui/es/language/zh-CN';
import enUS from 'vxe-pc-ui/es/language/en-US';
import globalComponents from '@/components';
import router from './router';
import store from './store';
import i18n from './locale';
import directive from './directive';
import App from './App.vue';
// Styles are imported via arco-plugin. See config/plugin/arcoStyleImport.ts in the directory for details
// 样式通过 arco-plugin 插件导入。详见目录文件 config/plugin/arcoStyleImport.ts
// https://arco.design/docs/designlab/use-theme-package
import '@/assets/style/global.less';
import '@/api/interceptor';

// VxeTable 国际化：注册语言包并跟随项目当前 locale
VxeUI.setI18n('zh-CN', zhCN);
VxeUI.setI18n('en-US', enUS);
const initLocale = (localStorage.getItem('arco-locale') ||
  'zh-CN') as 'zh-CN' | 'en-US';
VxeUI.setLanguage(initLocale);

// 确保 VxeTable 主题初始属性与 Arco 一致（navbar 挂载前的兜底）
const storedTheme = localStorage.getItem('arco-theme');
const isDarkInit = storedTheme === 'dark' || storedTheme === 'true';
document.body.setAttribute(
  'data-vxe-ui-theme',
  isDarkInit ? 'dark' : 'light',
);

const app = createApp(App);

app.use(ArcoVue, {});
app.use(VxeUIAll);
app.use(VxeUITable);

app.use(router);
app.use(store);
app.use(i18n);
app.use(globalComponents);
app.use(directive);

app.mount('#app');
