<template>
  <div>
    <!-- Mobile Overlay to prevent scrolling -->
    <div
      v-if="props.selectedObjects && props.showPropertiesPanel && isMobile"
      class="fixed inset-0 bg-black bg-opacity-50 z-[59] sm:hidden"
      @click="$emit('toggle-properties')"
    ></div>

    <!-- Mobile Toggle Button (Show Properties) -->
    <UButton
      variant="soft"
      icon="i-material-symbols:settings-outline"
      v-if="props.selectedObjects && !props.showPropertiesPanel"
      class="fixed bottom-4 left-4 z-[80] sm:hidden"
      @click="$emit('toggle-properties')"
    >
      Properties
    </UButton>

    <!-- Properties Panel -->
    <div
      v-if="props.selectedObjects && props.showPropertiesPanel"
      :key="
        props.selectedObjects.map((obj) => obj.id || obj.toString()).join(',')
      "
      class="scrollbar p-4 absolute left-4 top-16 z-[60] bg-cyan-950 rounded text-white min-w-52 border border-cyan-800 select-none overflow-y-auto max-h-[80%] sm:block"
      :class="{
        'fixed bottom-4 left-4 right-4 w-auto max-h-[70vh] sm:static sm:right-auto sm:w-52':
          isMobile,
      }"
      @touchmove.stop
    >
      <!-- Mobile Close Button -->
      <button
        v-if="isMobile"
        class="absolute top-2 right-2 z-[70] sm:hidden flex items-center justify-center w-8 h-8 bg-cyan-700 text-white rounded hover:bg-cyan-600 transition-colors"
        @click="$emit('toggle-properties')"
      >
        <Icon name="i-material-symbols:close" />
      </button>
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
        <template v-if="props.selectedObjects[0]?.roughOptions">
          <div>
            <span class="font-bold uppercase text-xs text-cyan-200"
              >Stroke</span
            >
            <div>
              <ColorPicker
                :value="props.selectedObjects[0].roughOptions.stroke"
                @change="
	              (args: string) =>
	                updateProperty(props.selectedObjects![0]!, 'roughOptions.stroke', args)
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
	                updateProperty(props.selectedObjects![0]!, 'roughOptions.fill', args, )
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
	                  props.selectedObjects![0]!,
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
              :options="['0', '1.5', '2.5']"
              :names="['Normal', 'Rough', 'Very Rough']"
              :icons="[
                'material-symbols:architecture-rounded',
                'ph:paint-brush-fill',
                'ph:pencil-fill',
              ]"
              @change="
	              (value: string) =>
	                {
                    updateProperty(
	                  props.selectedObjects![0]!,
	                  'roughOptions.roughness',
	                  Number.parseFloat(value),
	                );
                  updateProperty(
	                  props.selectedObjects![0]!,
	                  'roughOptions.preserveVertices',
	                  Number.parseFloat(value) < 2.5,
	                );
                }
	            "
            />
          </div>
          <div>
            <span class="font-bold uppercase text-xs text-cyan-200"
              >Stroke width</span
            >
            <RoughMultiPicker
              :default="
              props.selectedObjects[0].roughOptions.strokeWidth!.toString()
            "
              :options="['1', '3', '5']"
              :names="['Thin', 'Normal', 'Bold']"
              :icons="[
                'material-symbols:pen-size-1',
                'material-symbols:pen-size-3',
                'material-symbols:pen-size-4',
              ]"
              @change="
	              (value: string) =>
	                {
                   const strokeWidth = Number.parseFloat(value);

	                  updateProperty(
	                  props.selectedObjects![0]!,
	                  'roughOptions.strokeWidth',
	                   strokeWidth,
	                );
                 
	                updateProperty(
	                  props.selectedObjects![0]!,
	                  'roughOptions.strokeLineDash',
	                  calculateStrokeStyle(strokeWidth,  getStrokeStyle(props.selectedObjects![0]!.roughOptions.strokeLineDash))
	                )

                  updateProperty(
	                  props.selectedObjects![0]!,
	                  'roughOptions.fillWeight',
	                  strokeWidth / 2,
	                )

                  updateProperty(
	                  props.selectedObjects![0]!,
	                  'roughOptions.hachureGap',
	                  strokeWidth * 4,
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
	             {
                   updateProperty(
	                  props.selectedObjects![0]!,
	                  'roughOptions.strokeLineDash',
	                  calculateStrokeStyle(props.selectedObjects![0]!.roughOptions.strokeWidth!, value),
	                )
                   updateProperty(
	                  props.selectedObjects![0]!,
	                  'roughOptions.disableMultiStroke',
	                  value !== 'Solid',
	                )
                }
                  
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
	                  props.selectedObjects![0]!,
	                  'rounded',
	                  value !== 'Edged',
	                )
	            "
            />
          </div>
          <!-- ---------- ARROW SPECIFIC THINGS ---------- -->
          <template v-if="props.selectedObjects[0] instanceof FabricRoughArrow">
            <div>
              <span class="font-bold uppercase text-xs text-cyan-200"
                >Arrowheads</span
              >
              <div class="flex gap-4">
                <UTooltip text="Start Arrowhead Style">
                  <RoughManyPicker
                    :default="
                      ArrowHeadStyle[
                        props.selectedObjects[0].startArrowHeadStyle
                      ]
                    "
                    :options="
                      Object.keys(ArrowHeadStyle).filter((k) =>
                        isNaN(Number(k))
                      )
                    "
                    :icons="[
                      'i-ph:minus-bold', // 0: NoHead (no arrowhead)
                      'i-ph:arrow-right', // 1: Arrow (existing)
                      'i-ph:arrow-right-fill', // 2: FilledTriangle (existing)
                      'i-ph:arrow-right-duotone', // 3: Triangle (outline version)
                      'i-custom:bar-arrow', // 4: Bar (perpendicular line)
                      'i-custom:crow-one', // 5: CrowFootOne (single branch)
                      'i-custom:crow-one-many', // 6: CrowFootOneOrMany (fork shape)
                      'i-custom:crow-many', // 7: CrowFootMany (spread out)
                      'i-custom:circle-arrow-filled', // 8: FilledCircle
                      'i-custom:circle-arrow', // 9: Circle
                      'i-custom:diamond-arrow-filled', // 10: FilledDiamond
                      'i-custom:diamond-arrow', // 11: Diamond
                    ]"
                    @change="
                    (value: any) =>
                      updateProperty(
                        props.selectedObjects![0]!,
                        'startArrowHeadStyle',
                        ArrowHeadStyle[value]
                      )
                  "
                  />
                </UTooltip>
                <UTooltip text="End Arrowhead Style">
                  <RoughManyPicker
                    :default="
                      ArrowHeadStyle[props.selectedObjects[0].endArrowHeadStyle]
                    "
                    :options="
                      Object.keys(ArrowHeadStyle).filter((k) =>
                        isNaN(Number(k))
                      )
                    "
                    :icons="[
                      'i-ph:minus-bold', // 0: NoHead (no arrowhead)
                      'i-ph:arrow-right', // 1: Arrow (existing)
                      'i-ph:arrow-right-fill', // 2: FilledTriangle (existing)
                      'i-ph:arrow-right-duotone', // 3: Triangle (outline version)
                      'i-custom:bar-arrow', // 4: Bar (perpendicular line)
                      'i-custom:crow-one', // 5: CrowFootOne (single branch)
                      'i-custom:crow-one-many', // 6: CrowFootOneOrMany (fork shape)
                      'i-custom:crow-many', // 7: CrowFootMany (spread out)
                      'i-custom:circle-arrow-filled', // 8: FilledCircle
                      'i-custom:circle-arrow', // 9: Circle
                      'i-custom:diamond-arrow-filled', // 10: FilledDiamond
                      'i-custom:diamond-arrow', // 11: Diamond
                    ]"
                    @change="
                  (value: any) =>
                    updateProperty(
                      props.selectedObjects![0]!,
                      'endArrowHeadStyle',
                      ArrowHeadStyle[value]
                    )
                "
                  />
                </UTooltip>
              </div>
            </div>
          </template>
          <!-- ---------- </ARROW SPECIFIC THINGS> ---------- -->
        </template>
        <!-- ---------- </ Rough SPECIFIC THINGS>  -->

        <!-- ---------- TextBox SPECIFIC THINGS  -->
        <template
          v-if="
          props.selectedObjects.length === 1 &&
          props.selectedObjects[0]!.name === 'Text'
        "
        >
          <div>
            <span class="font-bold uppercase text-xs text-cyan-200"
              >Stroke</span
            >
            <div>
              <ColorPicker
                :value="props.selectedObjects[0]!.fill?.toString()"
                @change="
	              (args: string) =>
	                updateProperty(props.selectedObjects![0]!, 'fill', args, true)
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
              :model-value="props.selectedObjects[0]!.fontFamily"
              @change="
              (value: any) => {
                updateProperty(
                  props.selectedObjects![0]!,
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
              :default="props.selectedObjects[0]!.textAlign"
              :options="['left', 'center', 'right']"
              :icons="[
                'i-ph:text-align-left-bold',
                'i-ph:text-align-center-bold',
                'i-ph:text-align-right-bold',
              ]"
              @change="
	              (value: string) =>
	                updateProperty(
	                  props.selectedObjects![0]!,
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
          :value="props.selectedObjects[0]!.opacity"
          :max="1"
          :min="0"
          :step="0.1"
          @input="
          (event) =>
            updatePropertyEach(
              props.selectedObjects!,
              'opacity',
              // @ts-expect-error it does exist
              event.target?.value ?? 1
            )
        "
        />
      </div>
      <span class="font-bold uppercase text-xs text-cyan-200 block my-2"
        >Layer</span
      >
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
      <span class="font-bold uppercase text-xs text-cyan-200 block mt-4 mb-2"
        >Actions</span
      >
      <div class="flex gap-4">
        <UTooltip text="Duplicate">
          <UButton
            class="!bg-cyan-600 !text-white hover:!bg-cyan-500"
            icon="i-material-symbols-content-copy-outline-rounded"
            @click="duplicate()"
          />
        </UTooltip>
        <UTooltip text="Delete">
          <UButton
            class="!bg-cyan-600 !text-white hover:!bg-cyan-500"
            icon="i-material-symbols-delete-outline"
            @click="deleteObjects(props.selectedObjects)"
          />
        </UTooltip>
      </div>
      <!-- ---------- </ Common Properties> ----------  -->
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, watch, onUnmounted } from "vue";
import * as fabric from "fabric";
import lodashSet from "lodash.set";
import { ArrowHeadStyle } from "~/utils/constants";
import { FabricRoughArrow } from "~/shapes/roughArrow";
import { FabricRoughLine } from "~/shapes/roughLine";
import RoughMultiPicker from "./RoughMultiPicker.vue";
import cloneDeep from "lodash.clonedeep";

interface Props {
  selectedObjects?: fabric.FabricObject[];
  fabricCanvas: fabric.Canvas;
  showPropertiesPanel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPropertiesPanel: true,
});

defineEmits<{
  "toggle-properties": [];
}>();

// Check if we're on mobile
const isMobile = computed(() => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 640;
});

// Prevent body scrolling when mobile properties panel is open
watch(
  () => props.showPropertiesPanel && isMobile.value,
  (isOpen) => {
    if (typeof document === "undefined") return;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
);

// Cleanup on unmount
onUnmounted(() => {
  if (typeof document !== "undefined") {
    document.body.style.overflow = "";
  }
});

function updateProperty(
  obj: fabric.FabricObject,
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
  objs: fabric.FabricObject[],
  key: string,
  value: any,
  dirty?: boolean
) {
  objs.forEach((obj) => updateProperty(obj, key, value, dirty));
}

function bringToFront(objs: fabric.FabricObject[]) {
  const rawObj = toRaw(objs);
  rawObj.forEach((obj) => props.fabricCanvas.bringObjectToFront(obj));
  props.fabricCanvas.renderAll();
}
function bringForward(objs: fabric.FabricObject[]) {
  const rawObj = toRaw(objs);
  rawObj.forEach((obj) => props.fabricCanvas.bringObjectForward(obj, true));
  props.fabricCanvas.renderAll();
}
function bringToBack(objs: fabric.FabricObject[]) {
  const rawObj = toRaw(objs);
  rawObj.forEach((obj) => props.fabricCanvas.sendObjectToBack(obj));
  props.fabricCanvas.renderAll();
}
function bringBackward(objs: fabric.FabricObject[]) {
  const rawObj: fabric.FabricObject[] = toRaw(objs);
  rawObj.forEach((obj) => props.fabricCanvas.sendObjectBackwards(obj, true));
  props.fabricCanvas.renderAll();
}

function deleteObjects(objs: fabric.FabricObject[]) {
  const rawObj: fabric.FabricObject[] = toRaw(objs);
  // using this instead of just canvas.remove(obj) to get rid of annoying type error
  rawObj.forEach((obj) => props.fabricCanvas.remove(obj));
  props.fabricCanvas.discardActiveObject();
  props.fabricCanvas.renderAll();
}

async function duplicate() {
  const activeObjects = props.fabricCanvas.getActiveObjects();
  props.fabricCanvas.discardActiveObject();

  const toClone = JSON.stringify(cloneDeep(activeObjects)); // Deep copy via JSON

  const objects = await fabric.util.enlivenObjects(JSON.parse(toClone));

  const fabricObjects = objects.filter(
    (obj): obj is fabric.FabricObject => obj instanceof fabric.FabricObject
  );
  if (!fabricObjects.length) return;
  fabricObjects.forEach((obj) => {
    obj.set({
      left: obj.left + 10,
      top: obj.top + 10,
    });
    obj.setCoords();

    props.fabricCanvas.add(obj);
  });
  const selection = new fabric.ActiveSelection(fabricObjects, {
    canvas: props.fabricCanvas,
  });

  props.fabricCanvas.setActiveObject(selection);
  props.fabricCanvas.renderAll();

  // @ts-expect-error custom event
  props.fabricCanvas.fire("custom:added");
}
</script>
<style lang="css" scoped>
.scrollbar {
  scrollbar-width: thin; /* For Firefox */
  scrollbar-color: theme("colors.cyan.700") transparent; /* For Firefox */
}

/* Webkit-based browsers (Chrome, Safari, Edge) */
.scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar::-webkit-scrollbar-track {
  background: transparent; /* Track color */
  border-radius: 4px;
}

.scrollbar::-webkit-scrollbar-thumb {
  background: theme("colors.cyan.700"); /* Thumb color */
  border-radius: 4px;
}

.scrollbar::-webkit-scrollbar-thumb:hover {
  background: theme("colors.cyan.600"); /* Thumb color on hover */
}
</style>
