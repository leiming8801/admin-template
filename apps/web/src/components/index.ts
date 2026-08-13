import { App } from 'vue';
import Breadcrumb from './breadcrumb/index.vue';
import BasicTable from './basic-table/index.vue';

export default {
  install(Vue: App) {
    Vue.component('Breadcrumb', Breadcrumb);
    Vue.component('BasicTable', BasicTable);
  },
};
