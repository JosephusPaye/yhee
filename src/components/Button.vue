<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :target="target"
    :class="`button button-color--${color}`"
  >
    <slot></slot>
  </component>
</template>

<script>
export default {
  name: 'Button',
  props: {
    href: String,
    target: String,
    color: {
      type: String,
      default: 'normal', // 'normal', 'primary'
    },
  },
};
</script>

<style lang="scss">
.button {
  @apply cursor-default flex font-semibold justify-center px-4 py-2 rounded-full text-sm;
}

.button-color--normal {
  @apply bg-gray-300;

  &:hover,
  &:focus {
    @apply bg-gray-400;
  }

  &:active {
    @apply bg-gray-500;
  }
}

.button-color--primary {
  @apply bg-blue-500 text-white;

  &:hover,
  &:focus {
    @apply bg-blue-600;
  }

  &:active {
    @apply bg-blue-700;
  }
}
</style>
