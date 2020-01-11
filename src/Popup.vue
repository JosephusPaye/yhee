<template>
  <div id="app" class="font-sans p-6 text-center">
    <div class="text-2xl">1hr 32min</div>
    <div class="text-lg">on notion.so</div>
    <div class="mt-4">
      <Button href="dashboard.html" target="_new">Dashboard</Button>
    </div>
  </div>
</template>

<script>
import Button from './components/Button.vue';

export default {
  name: 'app',
  components: { Button },
};
</script>

<style>
@import './assets/tailwind.css';

#app {
  color: rgba(0, 0, 0, 0.87);
  min-width: 200px;
}
</style>
