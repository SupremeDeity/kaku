<template>
  <div
    ref="canvasWrapper"
    tabindex="1000"
    class="w-full h-full bg-gray-950"
    @keydown="handleKeyEvent"
  >
    <div class="absolute bottom-2 right-2 z-[1000] p-2 flex gap-1">
      <UButton
        to="https://github.com/supremedeity/kaku"
        target="_blank"
        icon="i-ph:github-logo-duotone"
        variant="soft"
        color="cyan"
      />
      <UTooltip
        ><UButton variant="soft" color="cyan" icon="i-ph:info-duotone" />
        <template #text
          ><span class="font-bold">Kaku</span> {{ " " }}
          <span class="text-cyan-400">{{ git_commit_sha }}</span></template
        ></UTooltip
      >
    </div>
    <div
      class="absolute left-1/2 -translate-x-1/2 z-[1000] top-3 flex gap-1 bg-gray-500 p-2 rounded"
    >
      <div v-for="mode in drawingModes" :key="mode">
        <UTooltip :text="mode">
          <button
            :class="[
              'flex items-center p-2  text-white rounded  transition-colors',
              mode === currentMode
                ? 'bg-blue-400 hover:bg-blue-300'
                : 'bg-gray-900 hover:bg-gray-800/60',
            ]"
            @click="currentMode = mode"
          >
            <Icon :name="drawingModesIconMap[mode]" />
          </button>
        </UTooltip>
      </div>
      <div class="border border-gray-600" />

      <UDropdown :items="dropdownItems" :popper="{ placement: 'bottom-start' }">
        <button
          class="flex bg-cyan-900 text-white rounded p-2 hover:bg-cyan-800/60 transition-colors"
        >
          <Icon name="i-material-symbols:menu-rounded" />
        </button>
      </UDropdown>
    </div>
    <PropertiesPanel
      :fabric-canvas="fabricCanvas"
      :selected-objects="selectedObjects"
    />
    <div
      v-if="currentMode === 'Draw'"
      class="p-4 absolute left-4 top-16 z-[1000] bg-cyan-950 rounded text-white min-w-52 border border-cyan-800 select-none"
    >
      <div>
        <span class="font-bold uppercase text-xs text-cyan-200">Stroke</span>
        <div>
          <ColorPicker
            :value="fabricCanvas.freeDrawingBrush?.color"
            @change="
              (val) => {
                if (fabricCanvas.freeDrawingBrush) {
                  fabricCanvas.freeDrawingBrush.color = val;
                  // Neccessary to force pull new value of fabricCanvas.freeDrawingBrush.color
                  $forceUpdate();
                }
              }
            "
          />
        </div>
      </div>
      <div>
        <span class="font-bold uppercase text-xs text-cyan-200">Fill</span>
        <RoughMultiPicker
          :default="
            fabricCanvas.freeDrawingBrush?.freehandOptions?.size.toString()
          "
          :options="['4', '8', '16']"
          :names="['Thin', 'Normal', 'Bold']"
          :icons="[
            'material-symbols:pen-size-1',
            'material-symbols:pen-size-3',
            'material-symbols:pen-size-4',
          ]"
          @change="
            (val) => {
              if (fabricCanvas.freeDrawingBrush?.freehandOptions)
                fabricCanvas.freeDrawingBrush.freehandOptions.size =
                  Number.parseInt(val);
            }
          "
        />
      </div>
    </div>
    <canvas ref="canvas" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { FabricObject } from "fabric";
import FontFaceObserver from "fontfaceobserver";
import { drawingModes, drawingModesIconMap } from "~/utils/constants";
import * as fabric from "fabric";

import CanvasHistory from "~/utils/fabric-history";
import PropertiesPanel from "./PropertiesPanel.vue";

const runtimeConfig = useRuntimeConfig();
const git_commit_sha = runtimeConfig.public.commitSha;

const dropdownItems = [
  [
    {
      label: "Export as PNG",
      icon: "i-material-symbols-download-rounded",
      click: async () => {
        downloadPNG();
      },
    },
  ],
  [
    {
      label: "Undo",
      icon: "i-ph-arrow-arc-left-duotone",
      shortcuts: ["CTRL", "Z"],
      click: async () => {
        await history.undo();
      },
    },
    {
      label: "Redo",
      icon: "i-ph-arrow-arc-right-duotone",
      shortcuts: ["CTRL", "Y"],
      click: async () => {
        await history.redo();
      },
    },
  ],
  [
    {
      label: "Clear Canvas",
      icon: "i-material-symbols-delete-outline-rounded",
      click: async () => {
        clearCanvas();
      },
    },
  ],
];

const canvasWrapper = ref(null);
const canvas: Ref<HTMLCanvasElement | undefined> = ref();
const selectedObjects = ref();
let fabricCanvas: fabric.Canvas;
let history: CanvasHistory;
let _clipboard: any;

const currentMode: Ref<(typeof drawingModes)[number]> = ref("Select");

declare module "fabric" {
  interface BaseBrush {
    freehandOptions: any;
  }
  interface FabricObject {
    isDrawing?: boolean;
  }
}

async function initializeCanvas() {
  fabricCanvas = new fabric.Canvas(canvas.value, {
    isDrawingMode: currentMode.value === "Draw",
    preserveObjectStacking: true,
    width: window.innerWidth,
    height: window.innerHeight,
    renderOnAddRemove: false,
    selection: currentMode.value === "Select",
    enablePointerEvents: true,
    enableRetinaScaling: true,
    selectionKey: "shiftKey",
  });

  fabric.InteractiveFabricObject.ownDefaults = {
    ...fabric.InteractiveFabricObject.ownDefaults,
    cornerStrokeColor: "slateblue",
    cornerColor: "slateblue",
    cornerStyle: "circle",
    borderColor: "slateblue",
    transparentCorners: false,
    padding: 4,
    borderScaleFactor: 2,
  };

  fabricCanvas.backgroundColor = "rgb(3 7 18)";
  const perfectFreehandBrush = new PerfectFreehandBrush(fabricCanvas);
  fabricCanvas.freeDrawingBrush = perfectFreehandBrush;
  perfectFreehandBrush.setOptions(defaultBrushSettings);
  perfectFreehandBrush.color = defaultBrushSettings.color;

  Promise.all(
    supportedFonts.map(async (f) => {
      const font = new FontFaceObserver(f);
      return font.load(null, 5000);
    })
  ).then(async () => {
    history = new CanvasHistory(fabricCanvas);
    await history.init();
  });

  window.addEventListener("resize", () => {
    fabricCanvas.setDimensions({
      width: window.document.documentElement.clientWidth,
      height: window.document.documentElement.clientHeight,
    });
  });
  fabricCanvas.on("mouse:wheel", handleZoom);
  fabricCanvas.on("mouse:down:before", handleMouseDown);
  fabricCanvas.on("mouse:move", handleMouseMove);
  fabricCanvas.on("mouse:up:before", handleMouseUp);
  fabricCanvas.on("selection:created", (e) => {
    console.log("Selection Created: ", e.selected);
    selectedObjects.value = fabricCanvas.getActiveObjects();
  });
  fabricCanvas.on("selection:updated", (_) => {
    selectedObjects.value = fabricCanvas.getActiveObjects();
  });
  fabricCanvas.on("selection:cleared", () => {
    selectedObjects.value = null;
  });
}

function downloadPNG() {
  const sel = new fabric.ActiveSelection(fabricCanvas.getObjects(), {
    canvas: fabricCanvas,
  });
  if (sel.isEmpty()) return;
  const dataURL = sel.toDataURL({
    left: -sel.width / 22,
    top: -sel.height / 22,
    width: sel.width * 1.1,
    height: sel.height * 1.1,
    format: "png",
    multiplier: 2,
  });
  const link = document.createElement("a");
  link.download = "kaku-" + new Date().toISOString() + ".png";
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function copy() {
  fabricCanvas
    ?.getActiveObject()
    ?.clone(["name"])
    .then((cloned) => {
      _clipboard = cloned;
    });
}

async function paste() {
  const clonedObj = await _clipboard.clone(["name", "padding"]);
  fabricCanvas.discardActiveObject();
  clonedObj.set({
    left: clonedObj.left + 10,
    top: clonedObj.top + 10,
    evented: true,
  });
  if (clonedObj instanceof fabric.ActiveSelection) {
    clonedObj.canvas = fabricCanvas;
    clonedObj.forEachObject((obj) => {
      fabricCanvas.add(obj);
    });
    // this should solve the unselectability
    clonedObj.setCoords();
  } else {
    fabricCanvas.add(clonedObj);
  }
  _clipboard.top += 10;
  _clipboard.left += 10;
  fabricCanvas.setActiveObject(clonedObj);
  fabricCanvas.requestRenderAll();
}

function handleZoom(opt: any) {
  const delta = opt.e.deltaY;
  let zoom = fabricCanvas.getZoom();
  zoom *= 0.999 ** delta;
  if (zoom > 20) zoom = 20;
  if (zoom < 0.01) zoom = 0.01;
  fabricCanvas.zoomToPoint(
    new fabric.Point(opt.e.offsetX, opt.e.offsetY),
    zoom
  );

  fabricCanvas.requestRenderAll();
  opt.e.preventDefault();
  opt.e.stopPropagation();
}

let shapePlacementMode = false;
let shape: FabricObject | undefined;
let startPoint: any;
let lastPosX: number;
let lastPosY: number;

function handleMouseDown(o: any) {
  const evt = o.e;
  // ON DRAGGING
  if (evt.button === 1) {
    fabricCanvas.isDrawingMode = false;
    // @ts-expect-error custom property added to fabricCanvas
    fabricCanvas.isDragging = true;
    fabricCanvas.selection = false;

    lastPosX = evt.clientX;
    lastPosY = evt.clientY;
  }
  // SHAPE PLACEMENT MODE
  else if (
    currentMode.value !== "Select" &&
    currentMode.value !== "Draw" &&
    currentMode.value !== "Text"
  ) {
    shapePlacementMode = true;
    startPoint = fabricCanvas.getScenePoint(o.e);
    handleShapePlacement(o);
  }

  // TEXT PLACEMENT MODE
  else if (currentMode.value === "Text") {
    const pointer = fabricCanvas.getScenePoint(o.e);
    const text = new fabric.Textbox("Edit text", {
      name: "Text",
      left: pointer.x,
      top: pointer.y,
      fontFamily: "Virgil",
      fontSize: 20,
      fill: "#ffffff",
      editable: true,
      selectable: true,
      width: 100,
      activeOn: "up", // fabric@6.3.0 bug: cant edit without this
    });
    fabricCanvas.add(text);
    text.selectAll();
    text.enterEditing();
    fabricCanvas.requestRenderAll();
    // @ts-expect-error custom event
    fabricCanvas.fire("custom:added");
    currentMode.value = "Select";
  }
}

function handleMouseMove(o: any) {
  // @ts-expect-error custom property added to fabricCanvas
  if (fabricCanvas.isDragging) {
    const e = o.e;
    const vpt = fabricCanvas.viewportTransform;
    vpt[4] += e.clientX - lastPosX;
    vpt[5] += e.clientY - lastPosY;
    fabricCanvas.requestRenderAll();
    lastPosX = e.clientX;
    lastPosY = e.clientY;
    return;
  } else if (!shapePlacementMode) return;

  handleShapePlacement(o);
}

function handleMouseUp() {
  // @ts-expect-error custom property added to fabricCanvas
  if (fabricCanvas.isDragging) {
    fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform);
    // @ts-expect-error custom property added to fabricCanvas
    fabricCanvas.isDragging = false;
    fabricCanvas.selection = currentMode.value === "Select";
    fabricCanvas.isDrawingMode = currentMode.value === "Draw";
  } else if (shapePlacementMode && shape) {
    shapePlacementMode = false;
    shape?.setCoords();
    shape.isDrawing = false;
    shape = undefined;
    fabricCanvas.requestRenderAll();
    currentMode.value = "Select";
    // @ts-expect-error custom event on object add, because we want to fire
    // on mouse up instead of as soon as its created
    fabricCanvas.fire("custom:added");
  }
}

async function handleKeyEvent(e: any) {
  if (e.key === "Delete" && currentMode.value === "Select") {
    fabricCanvas.getActiveObjects().forEach((obj) => {
      fabricCanvas.remove(obj);
    });
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  } else if (e.ctrlKey && e.key === "z") {
    history.undo();
    e.preventDefault();
  } else if (e.ctrlKey && e.key === "y") {
    history.redo();
    e.preventDefault();
  } else if (e.ctrlKey && e.key === "c") {
    copy();
  } else if (e.ctrlKey && e.key === "v") {
    await paste();
  }
}

function handleShapePlacement(o: any) {
  const pointer = fabricCanvas.getScenePoint(o.e);
  switch (currentMode.value) {
    case "Line":
      shape = drawRoughLine(startPoint, pointer);
      break;
    case "Arrow":
      shape = drawRoughArrow(startPoint, pointer);
      break;
    case "Ellipse":
      shape = drawRoughEllipse(startPoint, pointer);
      break;
    case "Rectangle":
      shape = drawRoughRectangle(startPoint, pointer);
      break;
    case "Diamond":
      shape = drawRoughDiamond(startPoint, pointer);
      break;
  }
}

function drawRoughLine(start: any, end: any) {
  if (shape) {
    // @ts-expect-error Custom function
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const line = new FabricRoughLine(undefined, {
    ...structuredClone(defaultShapeSettings),
    points: [start.x, start.y, end.x, end.y],
    lockScalingX: true,
    lockScalingY: true,
    objectCaching: false,
    isDrawing: true,
  });
  fabricCanvas.add(line);
  fabricCanvas.requestRenderAll();
  return line;
}

function drawRoughArrow(start: any, end: any) {
  if (shape) {
    // @ts-expect-error Custom function
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const arrow = new FabricRoughArrow(undefined, {
    ...structuredClone(defaultShapeSettings),
    points: [start.x, start.y, end.x, end.y],
    lockScalingX: true,
    lockScalingY: true,
    objectCaching: true,
    isDrawing: true,
  });
  fabricCanvas.add(arrow);
  fabricCanvas.requestRenderAll();
  return arrow;
}

function drawRoughEllipse(start: fabric.Point, end: fabric.Point) {
  if (shape) {
    // @ts-expect-error type THIS later
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const ellipse = new FabricRoughEllipse({
    ...structuredClone(defaultShapeSettings),
    points: [start.x, start.y, end.x, end.y],
  });
  fabricCanvas.add(ellipse);
  return ellipse;
}

function drawRoughRectangle(start: fabric.Point, end: fabric.Point) {
  if (shape) {
    // @ts-expect-error type THIS later
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const rectangle = new FabricRoughRectangle({
    ...structuredClone(defaultShapeSettings),
    points: [start.x, start.y, end.x, end.y],
  });
  fabricCanvas.add(rectangle);
  return rectangle;
}

function drawRoughDiamond(start: fabric.Point, end: fabric.Point) {
  if (shape) {
    // @ts-expect-error type THIS later
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const diamond = new FabricRoughDiamond({
    ...structuredClone(defaultShapeSettings),
    points: [start.x, start.y, end.x, end.y],
  });
  fabricCanvas.add(diamond);
  return diamond;
}

function setMode(mode: (typeof drawingModes)[number]) {
  fabricCanvas.discardActiveObject();
  currentMode.value = mode;
  fabricCanvas.isDrawingMode = mode === "Draw";
  fabricCanvas.selection = mode === "Select";

  // Set object selectability based on mode
  fabricCanvas.forEachObject((obj) => {
    obj.selectable = mode === "Select";
    obj.evented = mode === "Select";
  });

  // Handle Image Mode
  if (mode === "Image") {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*"; // Accept only image files

    fileInput.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const img = await fabric.FabricImage.fromURL(reader.result as string);
          // @ts-expect-error custom attribute
          img.name = "Image";
          fabricCanvas.viewportCenterObject(img);
          fabricCanvas.add(img);
          // @ts-expect-error custom event
          fabricCanvas.fire("custom:added");
          fabricCanvas.requestRenderAll();
          currentMode.value = "Select";
        };
        reader.readAsDataURL(file);
      } else {
        currentMode.value = "Select";
      }
    };

    fileInput.oncancel = () => (currentMode.value = "Select");
    fileInput.click();
  }

  fabricCanvas.requestRenderAll();
}

function clearCanvas() {
  if (confirm("Clear the canvas?") == true) {
    fabricCanvas.remove(...fabricCanvas.getObjects().concat());
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
  }
}

onMounted(async () => {
  await initializeCanvas();
});

onUnmounted(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose();
  }
});

watch(currentMode, (newMode) => {
  setMode(newMode);
});
</script>
