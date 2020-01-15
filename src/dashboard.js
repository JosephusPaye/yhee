import 'webextension-polyfill';

import Vue from 'vue';
import Dashboard from './Dashboard.vue';

Vue.config.productionTip = false;

new Vue({
  render: h => h(Dashboard),
}).$mount('#app');
