<template>
  <UTooltip :text="props.value">
    <UPopover :popper="{ placement: 'left' }">
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
      />
      <template #panel>
        <div class="p-4">
          <span class="text-xs text-gray-400">Presets</span>
          <div class="grid grid-flow-row grid-cols-4 grid-rows-4 gap-2 mb-2">
            <div v-for="preset in presets" :key="preset">
              <UTooltip :text="preset.toLowerCase()"
                ><span
                  :class="[
                    'size-8 rounded-md hover:scale-110 block',
                    preset === 'transparent' ? 'checkers' : '',
                    preset === props.value ? 'ring ring-2 ring-cyan-200' : '',
                  ]"
                  :style="{
                    backgroundColor: preset,
                  }"
                  @click="
                    () => {
                      emit('change', preset);
                      model = preset;
                    }
                  "
              /></UTooltip>
            </div>
          </div>
          <span class="text-xs text-gray-400">Shades</span>
          <div class="grid grid-flow-row grid-cols-4 grid-rows-2 gap-2 mb-2">
            <div v-for="shade in shades" :key="shade.hex">
              <UTooltip :text="shade.hexString()"
                ><span
                  :class="['size-8 rounded-md hover:scale-110 block']"
                  :style="{
                    backgroundColor: shade.hexString(),
                  }"
                  @click="
                    () => {
                      emit('change', shade.hexString());
                      model = shade.hexString();
                    }
                  "
              /></UTooltip>
            </div>
          </div>
          <UInput
            :model-modifiers="{ trim: true }"
            :value="model?.replace('#', '')"
            maxlength="8"
            @input="
              (e: any) => {
                console.log(e.target.value)
               try {
                 const color = new Values(`#${e.target.value}`)
                if(color) {
                  emit('change', color.hexString())
                  model = e.target.value
                }
               }
               catch(e) {}
              }
            "
          >
            <template #leading> <span class="text-gray-400">#</span> </template>
          </UInput>
        </div>
      </template>
    </UPopover>
  </UTooltip>
</template>

<script lang="ts" setup>
import Values from "values.js";

const shades = computed(() =>
  new Values(props.value)
    .all(25)
    .filter((v) => v.alpha >= 0 && v.type !== "base")
);

const presets = [
  "transparent",
  "#ffffffff",
  "#212529ff",
  "#ced4daff",
  "#ff8787ff",
  "#f783acff",
  "#da77f2ff",
  "#9775faff",
  "#748ffcff",
  "#4dabf7ff",
  "#3bc9dbff",
  "#38d9a9ff",
  "#69db7cff",
  "#a9e34bff",
  "#ffd43bff",
  "#ffa94dff",
];
const props = defineProps<{
  value?: string;
}>();
const emit = defineEmits(["change"]);
const model = ref(props.value);
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
