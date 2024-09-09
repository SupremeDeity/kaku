<template>
  <div
    v-if="props.selectedObjects"
    class="p-4 absolute left-4 top-16 z-[1000] bg-cyan-950 rounded text-white min-w-52 border border-cyan-800 select-none"
  >
    <span
      class="text-xs bg-cyan-900 text-cyan-400 p-1 rounded border border-cyan-700"
      >{{
        props.selectedObjects.length > 1
          ? "group"
          : props.selectedObjects[0].name
      }}</span
    >
    <div
      v-if="
        props.selectedObjects.length === 1 &&
        props.selectedObjects[0].roughOptions
      "
      class="pt-4 flex flex-col gap-2"
    >
      <div>
        <span class="font-bold uppercase text-xs text-cyan-200">Stroke</span>
        <ColorPicker
          :value="props.selectedObjects[0].roughOptions.stroke"
          @change="
	              (args: string) =>
	                updateProperty(props.selectedObjects[0], 'roughOptions.stroke', args, )
	            "
        />
      </div>
      <div v-if="!(props.selectedObjects[0] instanceof FabricRoughArrow)">
        <span class="font-bold uppercase text-xs text-cyan-200"
          >Background</span
        >
        <ColorPicker
          :value="props.selectedObjects[0].roughOptions.fill"
          @change="
	              (args: string) =>
	                updateProperty(props.selectedObjects[0], 'roughOptions.fill', args, )
	            "
        />
      </div>
      <div
        v-if="
          props.selectedObjects[0].roughOptions.fill &&
          props.selectedObjects[0].roughOptions.fill !== 'transparent'
        "
      >
        <span class="font-bold uppercase text-xs text-cyan-200">Fill</span>
        <RoughMultiPicker
          :default="props.selectedObjects[0].roughOptions.fillStyle"
          :options="['hachure', 'cross-hatch', 'solid']"
          @change="
	              (value: string) =>
	                updateProperty(
	                  props.selectedObjects[0],
	                  'roughOptions.fillStyle',
	                  value,
	                )
	            "
        />
      </div>
      <div>
        <span class="font-bold uppercase text-xs text-cyan-200">Roughness</span>
        <RoughMultiPicker
          :default="props.selectedObjects[0].roughOptions.roughness.toString()"
          :options="['0', '1', '2']"
          :icons="[
            'material-symbols:architecture-rounded',
            'ph:paint-brush-fill',
            'ph:pencil-fill',
          ]"
          @change="
	              (value: string) =>
	                updateProperty(
	                  props.selectedObjects[0],
	                  'roughOptions.roughness',
	                  Number.parseInt(value),
	                )
	            "
        />
      </div>
      <div>
        <span class="font-bold uppercase text-xs text-cyan-200"
          >Stroke width</span
        >
        <RoughMultiPicker
          :default="
            props.selectedObjects[0].roughOptions.strokeWidth.toString()
          "
          :options="['1', '2', '3']"
          :icons="[
            'material-symbols:pen-size-1',
            'material-symbols:pen-size-3',
            'material-symbols:pen-size-4',
          ]"
          @change="
	              (value: string) =>
	                {
	                  updateProperty(
	                  props.selectedObjects[0],
	                  'roughOptions.strokeWidth',
	                  Number.parseInt(value),
	                )
	                updateProperty(
	                  props.selectedObjects[0],
	                  'roughOptions.strokeLineDash',
	                  calculateStrokeStyle(props.selectedObjects[0].roughOptions.strokeWidth,  getStrokeStyle(props.selectedObjects[0].roughOptions.strokeLineDash))
	                )
	                }
	            "
        />
      </div>
      <div>
        <span class="font-bold uppercase text-xs text-cyan-200"
          >Stroke style</span
        >
        <RoughMultiPicker
          :default="
            getStrokeStyle(props.selectedObjects[0].roughOptions.strokeLineDash)
          "
          :options="['Solid', 'Dashed', 'Dotted']"
          :icons="[
            'ph:line-vertical-bold',
            'ph:circle-dashed-bold',
            'ph:dots-three-vertical-bold',
          ]"
          @change="
	              (value: string) =>
	                updateProperty(
	                  props.selectedObjects[0],
	                  'roughOptions.strokeLineDash',
	                  calculateStrokeStyle(props.selectedObjects[0].roughOptions.strokeWidth, value),
	                )
	            "
        />
      </div>
      <div v-if="ROUNDABLES.includes(props.selectedObjects[0].type)">
        <span class="font-bold uppercase text-xs text-cyan-200">Roundness</span>
        <RoughMultiPicker
          :default="props.selectedObjects[0].rounded ? 'Rounded' : 'Edged'"
          :options="['Edged', 'Rounded']"
          :icons="[
            'material-symbols:rectangle-outline',
            'material-symbols:rounded-corner-rounded',
          ]"
          @change="
	              (value: string) =>
	                updateProperty(
	                  props.selectedObjects[0],
	                  'rounded',
	                  value === 'Edged' ? false : true,
	                )
	            "
        />
      </div>
      <div>
        <span class="font-bold uppercase text-xs text-cyan-200">Opacity</span>
        <!-- eslint-disable-next-line vue/html-self-closing -->
        <input
          class="block"
          type="range"
          :value="props.selectedObjects[0].opacity"
          :max="1"
          :min="0"
          :step="0.1"
          @input="
            (event) =>
              updateProperty(
                props.selectedObjects[0],
                'opacity',
                // @ts-expect-error it does exist
                event.target?.value ?? 1
              )
          "
        />
      </div>
      <!-- <hr class="border-cyan-800" />
      <div class="flex gap-4">
        <UButton
          color="cyan"
          icon="i-material-symbols-flip-to-front"
          @click="
            () => {
              props.fabricCanvas.bringObjectForward(props.selectedObjects[0]);
              props.fabricCanvas.renderAll();
            }
          "
        />
        <UButton
          color="cyan"
          icon="i-material-symbols-flip-to-back"
          @click="
            () => {
              props.fabricCanvas.sendObjectBackwards(props.selectedObjects[0]);
              props.fabricCanvas.renderAll();
            }
          "
        />
      </div> -->
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { FabricObject } from "fabric";
import lodashSet from "lodash.set";
const props = defineProps(["selectedObjects", "fabricCanvas"]);

function updateProperty(obj: FabricObject, key: string, value: any) {
  lodashSet(obj, key, value);
  // @ts-expect-error custom function on rough objects
  obj.update && obj.update();
  props.fabricCanvas.fire("object:modified");
  props.fabricCanvas.requestRenderAll();
}
</script>
