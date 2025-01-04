<template>
  <div
    v-if="props.selectedObjects"
    :key="props.selectedObjects"
    class="p-4 absolute left-4 top-16 z-[1000] bg-cyan-950 rounded text-white min-w-52 border border-cyan-800 select-none"
  >
    <span
      class="text-xs bg-cyan-900 text-cyan-400 p-1 rounded border border-cyan-700"
      >{{
        props.selectedObjects.length > 1
          ? "Multi-Selection"
          : props?.selectedObjects[0]?.name
      }}</span
    >
    <div
      v-if="props.selectedObjects.length === 1"
      class="pt-4 flex flex-col gap-2"
    >
      <!-- ---------- Rough SPECIFIC THINGS  -->
      <template v-if="props.selectedObjects[0].roughOptions">
        <div>
          <span class="font-bold uppercase text-xs text-cyan-200">Stroke</span>
          <div>
            <ColorPicker
              :value="props.selectedObjects[0].roughOptions.stroke"
              @change="
	              (args: string) =>
	                updateProperty(props.selectedObjects[0], 'roughOptions.stroke', args)
	            "
            />
          </div>
        </div>
        <div
          v-if="
            !(
              props.selectedObjects[0] instanceof FabricRoughArrow ||
              props.selectedObjects[0] instanceof FabricRoughLine
            )
          "
        >
          <span class="font-bold uppercase text-xs text-cyan-200"
            >Background</span
          >
          <div>
            <ColorPicker
              :value="props.selectedObjects[0].roughOptions.fill"
              @change="
	              (args: string) =>
	                updateProperty(props.selectedObjects[0], 'roughOptions.fill', args, )
	            "
            />
          </div>
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
            :icons="[
              'i-material-symbols:stroke-full',
              'i-material-symbols:grid-4x4-rounded',
              'i-material-symbols:rectangle-rounded',
            ]"
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
          <span class="font-bold uppercase text-xs text-cyan-200"
            >Roughness</span
          >
          <RoughMultiPicker
            :default="
              props.selectedObjects[0].roughOptions.roughness.toString()
            "
            :options="['0', '1', '2']"
            :names="['Normal', 'Rough', 'Very Rough']"
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
            :names="['Thin', 'Normal', 'Bold']"
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
              getStrokeStyle(
                props.selectedObjects[0].roughOptions.strokeLineDash
              )
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
          <span class="font-bold uppercase text-xs text-cyan-200"
            >Roundness</span
          >
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
        <!-- ---------- ARROW SPECIFIC THINGS ---------- -->
        <template v-if="props.selectedObjects[0] instanceof FabricRoughArrow">
          <div>
            <span class="font-bold uppercase text-xs text-cyan-200"
              >End Arrowhead style</span
            >
            <RoughMultiPicker
              :default="
                ArrowHeadStyle[props.selectedObjects[0].endArrowHeadStyle]
              "
              :options="
                Object.keys(ArrowHeadStyle).filter((k) => isNaN(Number(k)))
              "
              :icons="[
                'i-ph:line-vertical-bold',
                'i-ph:arrow-bend-right-up',
                'i-ph:arrow-bend-right-up-fill',
              ]"
              @change="
              (value: any) =>
                updateProperty(
                  props.selectedObjects[0],
                  'endArrowHeadStyle',
                  ArrowHeadStyle[value]
                )
            "
            />
          </div>
          <div>
            <span class="font-bold uppercase text-xs text-cyan-200"
              >Start Arrowhead style</span
            >
            <RoughMultiPicker
              :default="
                ArrowHeadStyle[props.selectedObjects[0].startArrowHeadStyle]
              "
              :options="
                Object.keys(ArrowHeadStyle).filter((k) => isNaN(Number(k)))
              "
              :icons="[
                'i-ph:line-vertical-bold',
                'i-ph:arrow-bend-right-up',
                'i-ph:arrow-bend-right-up-fill',
              ]"
              @change="
                (value) =>
                  updateProperty(
                    props.selectedObjects[0],
                    'startArrowHeadStyle',
                    ArrowHeadStyle[value]
                  )
              "
            />
          </div>
        </template>
        <!-- ---------- </ARROW SPECIFIC THINGS> ---------- -->
      </template>
      <!-- ---------- </ Rough SPECIFIC THINGS>  -->

      <!-- ---------- TextBox SPECIFIC THINGS  -->
      <template
        v-if="
          props.selectedObjects.length === 1 &&
          props.selectedObjects[0].name === 'Text'
        "
      >
        <div>
          <span class="font-bold uppercase text-xs text-cyan-200">Stroke</span>
          <div>
            <ColorPicker
              :value="props.selectedObjects[0].fill"
              @change="
	              (args: string) =>
	                updateProperty(props.selectedObjects[0], 'fill', args, true)
	            "
            />
          </div>
        </div>
        <div>
          <span class="font-bold uppercase text-xs text-cyan-200"
            >Font Family</span
          >
          <USelect
            :options="supportedFonts"
            :model-value="props.selectedObjects[0].fontFamily"
            @change="
              (value) => {
                updateProperty(
                  props.selectedObjects[0],
                  'fontFamily',
                  value,
                  true
                );
              }
            "
          />
        </div>
        <div>
          <span class="font-bold uppercase text-xs text-cyan-200"
            >Text Alignment</span
          >
          <RoughMultiPicker
            :default="props.selectedObjects[0].textAlign"
            :options="['left', 'center', 'right']"
            :icons="[
              'i-ph:text-align-left-bold',
              'i-ph:text-align-center-bold',
              'i-ph:text-align-right-bold',
            ]"
            @change="
	              (value: string) =>
	                updateProperty(
	                  props.selectedObjects[0],
	                  'textAlign',
	                  value,
                    true
	                )
	            "
          />
        </div>
      </template>
      <!-- ---------- </TextBox SPECIFIC THINGS>  -->
    </div>
    <!-- ---------- Common Properties ----------  -->
    <div class="my-4">
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
            updatePropertyEach(
              props.selectedObjects,
              'opacity',
              // @ts-expect-error it does exist
              event.target?.value ?? 1
            )
        "
      />
    </div>
    <div class="flex gap-4">
      <UTooltip text="Send to Back">
        <UButton
          class="!bg-cyan-600 !text-white hover:!bg-cyan-500"
          icon="i-material-symbols-flip-to-back"
          @click="bringToBack(props.selectedObjects)"
        />
      </UTooltip>
      <UTooltip text="Bring backward">
        <UButton
          class="!bg-cyan-600 !text-white hover:!bg-cyan-500"
          icon="i-material-symbols-arrow-downward-alt"
          @click="bringBackward(props.selectedObjects)"
        />
      </UTooltip>
      <UTooltip text="Bring forward">
        <UButton
          class="!bg-cyan-600 !text-white hover:!bg-cyan-500"
          icon="i-material-symbols-arrow-upward-alt"
          @click="bringForward(props.selectedObjects)"
        />
      </UTooltip>
      <UTooltip text="Send to Front">
        <UButton
          class="!bg-cyan-600 !text-white hover:!bg-cyan-500"
          icon="i-material-symbols-flip-to-front"
          @click="bringToFront(props.selectedObjects)"
        />
      </UTooltip>
    </div>
    <!-- ---------- </ Common Properties> ----------  -->
  </div>
</template>
<script lang="ts" setup>
import type { FabricObject } from "fabric";
import lodashSet from "lodash.set";
import { ArrowHeadStyle } from "~/utils/constants";
import RoughMultiPicker from "./RoughMultiPicker.vue";

const props = defineProps(["selectedObjects", "fabricCanvas"]);

function updateProperty(
  obj: FabricObject,
  key: string,
  value: any,
  dirty?: boolean
) {
  lodashSet(obj, key, value);
  if (dirty) lodashSet(obj, "dirty", dirty);
  // @ts-expect-error custom function on rough objects
  if (obj.update) obj.update();
  props.fabricCanvas.fire("object:modified");
  props.fabricCanvas.requestRenderAll();
}

// Updates the property for each object in array
function updatePropertyEach(
  objs: FabricObject[],
  key: string,
  value: any,
  dirty?: boolean
) {
  objs.forEach((obj) => updateProperty(obj, key, value, dirty));
}

function bringToFront(objs: FabricObject[]) {
  objs.forEach((obj) => props.fabricCanvas.bringObjectToFront(obj));
  props.fabricCanvas.fire("object:modified");
  props.fabricCanvas.requestRenderAll();
}
function bringForward(objs: FabricObject[]) {
  objs.forEach((obj) => props.fabricCanvas.bringObjectForward(obj));
  props.fabricCanvas.fire("object:modified");
  props.fabricCanvas.requestRenderAll();
}
function bringToBack(objs: FabricObject[]) {
  objs.forEach((obj) => props.fabricCanvas.sendObjectToBack(obj));
  props.fabricCanvas.fire("object:modified");
  props.fabricCanvas.requestRenderAll();
}
function bringBackward(objs: FabricObject[]) {
  objs.forEach((obj) => props.fabricCanvas.sendObjectBackwards(obj));
  props.fabricCanvas.fire("object:modified");
  props.fabricCanvas.requestRenderAll();
}
</script>
