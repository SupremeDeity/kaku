<template>
  <UTooltip :text="props.value">
    <UPopover class="flex items-center" :popper="{ placement: 'left' }">
      <div
        :class="[
          'size-8 rounded-md hover:scale-110',
          !props.value || props.value === 'transparent' ? 'checkers' : '',
          previewClass,
        ]"
        :style="{
          backgroundColor:
            !props.value || props.value === 'transparent'
              ? 'rgb(50, 50, 50)'
              : props.value,
        }"
      />
      <template #panel>
        <div class="p-4 max-w-52 space-y-2">
          <span class="text-xs text-gray-400 font-bold text-start"
            >Presets</span
          >
          <div class="grid grid-flow-row grid-cols-4 grid-rows-4 mb-2">
            <div v-for="preset in presets" :key="preset">
              <UTooltip :text="preset.toLowerCase()">
                <span
                  :class="[
                    'size-8 rounded-md hover:scale-110 block',
                    preset === 'transparent' ? 'checkers' : '',
                    preset === props.value ? 'ring-2 ring-cyan-200' : '',
                  ]"
                  :style="{
                    backgroundColor:
                      preset === 'transparent' ? '#727272FF' : preset,
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
          <span class="text-xs text-gray-400 font-bold">Shades</span>
          <div class="grid grid-flow-row grid-cols-4 grid-rows-2 mb-2">
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
          <div class="flex gap-2">
            <UInput
              :model-modifiers="{ trim: true }"
              :value="model?.replace('#', '')"
              :model-value="model?.replace('#', '')"
              maxlength="8"
              color="cyan"
              @input="
              (e: any) => {
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
              <template #leading>
                <span class="text-gray-400">#</span>
              </template>
            </UInput>
            <UButton
              color="cyan"
              icon="i-ph:eyedropper-duotone"
              @click="openEyeDropper"
            />
          </div>
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
  previewClass?: string;
}>();
const emit = defineEmits(["change"]);
const model = ref(props.value);

const openEyeDropper = () => {
  // @ts-expect-error Well it does exist
  if (!window.EyeDropper) {
    alert("Eyedropper not supported on your browser");
    return;
  }

  // @ts-expect-error Well it does exist
  const eyeDropper = new EyeDropper();

  eyeDropper
    .open()
    .then((result: any) => {
      try {
        const hexString = `${result.sRGBHex}ff`;
        const color = new Values(hexString);
        if (color) {
          emit("change", hexString);
          model.value = hexString;
        }
      } catch (e) {
        console.log(e);
      }
    })
    .catch((e: any) => {
      console.log(e);
    });
};
</script>

<style scoped>
.checkers {
  --color-1: transparent;
  --color-2: #4a4a4a;
  background-image: linear-gradient(
      45deg,
      var(--color-2) 25%,
      var(--color-1) 25%
    ),
    linear-gradient(135deg, var(--color-2) 25%, var(--color-1) 25%),
    linear-gradient(45deg, var(--color-1) 75%, var(--color-2) 75%),
    linear-gradient(135deg, var(--color-1) 75%, var(--color-2) 75%);
  background-size: 15px 15px; /* Must be a square */
  background-position: 0 0, 7.5px 0, 7.5px -7.5px, 0px 7.5px;
}
</style>
