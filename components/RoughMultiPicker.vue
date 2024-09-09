<template>
  <div class="flex gap-4 text-lg">
    <button
      v-for="(option, index) in props.options"
      :key="option"
      :class="[
        'bg-cyan-600 p-1 font-bold rounded w-8 h-8 flex items-center justify-center',
        style === option ? 'outline outline-2 outline-cyan-200' : '',
      ]"
      @click="changeOption(option)"
    >
      <Icon
        v-if="props.icons && props.icons[index]"
        :name="props.icons[index]"
        class=""
      />
      <span v-if="!props.icons || !props.icons[index]">{{
        option[0].toUpperCase()
      }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
const emit = defineEmits(["change"]);
const props = defineProps({
  options: { type: Array, required: true },
  default: { type: String, required: true },
  // eslint-disable-next-line vue/require-default-prop
  icons: { type: Array<string>, required: false },
});
const style = ref(props.default);

const changeOption = (value: string) => {
  style.value = value;
  emit("change", value);
};
</script>
<style></style>
