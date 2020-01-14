<template>
  <div id="app" class="bg-gray-200 min-h-screen px-6 py-16 min-w-screen">
    <TopDomains />
  </div>
</template>

<script>
import 'focus-visible';
import Chart from 'chart.js';
import TopDomains from './components/TopDomains.vue';

Chart.defaults.global.defaultFontFamily =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
Chart.defaults.global.defaultFontSize = 13;

export default {
  name: 'dashboard',
  components: {
    TopDomains,
  },
};
</script>

<style>
@import './assets/tailwind.css';

#app {
  color: rgba(0, 0, 0, 0.87);
  @apply text-base;
}

.js-focus-visible :focus:not(.focus-visible) {
  outline: none;
}
</style>
