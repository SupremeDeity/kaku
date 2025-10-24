<!-- Specifically created for use when many options(>3) are available -->
<template>
  <div>
    <UPopover>
      <UButton
        :icon="
          props.icons && props.options.indexOf(style) >= 0
            ? props.icons[props.options.indexOf(style)]
            : null
        "
        color="cyan"
      />

      <template #panel="{ close }">
        <div class="p-2 flex flex-wrap gap-2 max-w-32">
          <UTooltip
            v-for="(option, index) in props.options"
            :key="option"
            :text="
              stylizeName(
                props.names?.length >= index + 1 ? props.names[index] : option
              )
            "
          >
            <button
              :class="[
                'bg-cyan-600 p-1 font-bold rounded w-8 h-8 flex items-center justify-center hover:bg-cyan-500',
                style === option ? 'outline outline-2 outline-cyan-200' : '',
              ]"
              @click="
                changeOption(option);
                close();
              "
            >
              <Icon
                v-if="props.icons && props.icons[index]"
                :name="props.icons[index]"
              />
              <span v-if="!props.icons || !props.icons[index]">{{
                option[0].toUpperCase()
              }}</span>
            </button>
          </UTooltip>
        </div>
      </template>
    </UPopover>
  </div>
</template>

<script lang="js" setup>
import { ref } from 'vue';
const emit = defineEmits(["change"]);
const props = defineProps({
  // For tooltips.
  names: { type: Array, required: false },
  options: { type: Array, required: true },
  default: { type: String, required: false },
  // eslint-disable-next-line vue/require-default-prop
  icons: { type: Array, required: false },
});
const style = ref(props.default);

const changeOption = (value) => {
  style.value = value;
  emit("change", value);
};

const stylizeName = (name) => (name.charAt(0).toUpperCase() + name.slice(1)).replace(/([A-Z])/g, ' $1').trim()
</script>
<style></style>
