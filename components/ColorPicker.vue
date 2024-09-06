<template>
  <div
    :class="[
      'size-8 rounded-md hover:scale-110',
      !props.value || props.value === 'transparent' ? 'checkers' : '',
    ]"
    :style="{
      backgroundColor:
        !props.value || props.value === 'transparent'
          ? 'rgb(50, 50, 50)'
          : props.value,
    }"
  >
    <input
      class="opacity-0 block size-8 border-0 hover:cursor-pointer"
      type="color"
      :value="props.value"
      @change="emit('change', $event.target?.value ?? '#ffffff')"
    />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  value?: string;
}>();
const emit = defineEmits(["change"]);
</script>

<style scoped>
.checkers {
  background-image: linear-gradient(45deg, #4a4a4a 25%, transparent 25%),
    linear-gradient(135deg, #4a4a4a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #4a4a4a 75%),
    linear-gradient(135deg, transparent 75%, #4a4a4a 75%);
  background-size: 15px 15px; /* Must be a square */
  background-position: 0 0, 7.5px 0, 7.5px -7.5px, 0px 7.5px;
}
</style>
