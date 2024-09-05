<template>
  <div class="flex gap-4">
    <button
      v-for="option in props.options"
      :key="option"
      :class="[
        'bg-cyan-600 p-1 text-cyan-950 rounded font-bold w-8 h-8',
        style === option ? 'border-[3px] border-cyan-200' : '',
      ]"
      @click="changeOption(option)"
    >
      {{ option[0].toUpperCase() }}
    </button>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits(["change"]);
const props = defineProps({
  options: { type: Array<string>, required: true },
  default: { type: String, required: true },
});
const style = ref(props.default);

const changeOption = (value: string) => {
  style.value = value;
  emit("change", value);
};
</script>
<style></style>
