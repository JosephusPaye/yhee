<template>
  <div class="bg-white w-full max-w-2xl mx-auto rounded shadow">
    <h1 class="border-b leading-none px-6 py-5 text-2xl flex">
      <div class="flex-grow mr-8">{{ title }}</div>
      <slot name="actions"></slot>
    </h1>
    <div class="bg-gray-200 border-b flex px-6">
      <button
        class="border-blue-400 px-3 py-3 text-sm tracking-wide uppercase font-medium text-gray-600 hover:text-gray-800"
        :class="{
          'border-b-1.5 text-gray-900 hover:text-gray-900':
            tab.id === activeTab.id,
        }"
        v-for="tab in tabs"
        :key="tab.id"
        @click="selectTab(tab)"
      >{{ tab.label }}</button>
    </div>
    <div class="p-6">
      <slot :activeTab="activeTab"></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'panel',
  props: {
    title: {
      type: String,
      required: true,
    },
    tabs: {
      type: Array,
      required: true,
    },
    preSelect: String,
  },
  data() {
    return {
      activeTab:
        this.tabs.find(tab => tab.id === this.preSelect) || this.tabs[0],
    };
  },
  methods: {
    selectTab(tab) {
      this.activeTab = tab;
      this.$emit('tab-change', tab);
    },
  },
};
</script>
