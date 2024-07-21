<template>
  <div class="canvas-container">
    <div
      ref="canvasWrapper"
      tabindex="1000"
      class="w-full h-full"
      @keydown="handleKeyEvent"
    >
      <div class="toolbar">
        <button
          v-for="mode in drawingModes"
          :key="mode"
          :class="['mode-button', { active: currentMode === mode }]"
          @click="setMode(mode)"
        >
          {{ mode }}
        </button>
        <button class="clear-button" @click="clearCanvas">Clear Canvas</button>
      </div>
      <canvas ref="canvas" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as fabric from "fabric";
import rough from "roughjs";

const canvasWrapper = ref(null);
const canvas: Ref<HTMLCanvasElement | undefined> = ref();
let fabricCanvas: fabric.Canvas;
const drawingModes = ["Select", "Draw", "Circle", "Rectangle", "Line"] as const;
const currentMode: Ref<(typeof drawingModes)[number]> = ref("Draw");

const brushSettings = {
  cap: false,
  thinning: 0.38,
  streamline: 0.5,
  smoothing: 0.64,
  taperStart: 30,
  taperEnd: 30,
  tolerance: 0.01,
  highQuality: true,
  generalEasing: (t: number) => t,
  easingStart: (t: number) => 1 + --t * t * t * t * t,
  easingEnd: (t: number) => 1 + --t * t * t * t * t,
};

function initializeCanvas() {
  fabricCanvas = new fabric.Canvas(canvas.value, {
    isDrawingMode: currentMode.value === "Draw",
    preserveObjectStacking: true,
    enableRetinaScaling: false,
    width: window.innerWidth,
    height: window.innerHeight,
    renderOnAddRemove: false,
  });

  customizePencilBrush(brushSettings);
  setBrush();

  fabricCanvas.on("mouse:wheel", handleZoom);
  fabricCanvas.on("mouse:down:before", handleMouseDown);
  fabricCanvas.on("mouse:move", handleMouseMove);
  fabricCanvas.on("mouse:up", handleMouseUp);
}

function setBrush() {
  const customBrush = new fabric.PencilBrush(fabricCanvas);
  fabricCanvas.freeDrawingBrush = customBrush;
  customBrush.color = "black";
  customBrush.width = 8;
}

function handleZoom(opt: any) {
  const delta = opt.e.deltaY;
  let zoom = fabricCanvas.getZoom();
  zoom *= 0.999 ** delta;
  if (zoom > 20) zoom = 20;
  if (zoom < 0.01) zoom = 0.01;
  fabricCanvas.zoomToPoint(new fabric.Point( opt.e.offsetX,  opt.e.offsetY ), zoom);
  fabricCanvas.requestRenderAll();
  opt.e.preventDefault();
  opt.e.stopPropagation();
}

let objectPlacementMode = false;
let startPoint: any;
let lastPosX: number;
let lastPosY: number;

function handleMouseDown(o: any) {
  const evt = o.e;

  if (evt.altKey === true) {
    fabricCanvas.isDrawingMode = false;
    // @ts-expect-error custom property added to fabricCanvas
    fabricCanvas.isDragging = true;
    fabricCanvas.selection = false;

    lastPosX = evt.clientX;
    lastPosY = evt.clientY;
  } else if (currentMode.value !== "Select" && currentMode.value !== "Draw") {
    objectPlacementMode = true;
    // TODO: TAKE A LOOK AT THIS AGAIN
    startPoint = fabricCanvas.getViewportPoint(o.e);
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
  } else if (!objectPlacementMode) return;

  // TODO: TAKE A LOOK AT THIS AGAIN
  const pointer = fabricCanvas.getViewportPoint(o.e);

  switch (currentMode.value) {
    case "Circle":
      drawRoughCircle(startPoint, pointer);
      break;
    case "Rectangle":
      drawRoughRectangle(startPoint, pointer);
      break;
    case "Line":
      drawRoughLine(startPoint, pointer);
      break;
  }
}

function handleMouseUp() {
  fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform);
  // @ts-expect-error custom property added to fabricCanvas
  fabricCanvas.isDragging = false;
  fabricCanvas.selection = currentMode.value === "Select";
  fabricCanvas.isDrawingMode = currentMode.value === "Draw";

  objectPlacementMode = false;
  fabricCanvas.renderAll();
}

function drawRoughCircle(start: fabric.Point, end: fabric.Point) {
  const activeObject = fabricCanvas.getActiveObject();
  if (activeObject) fabricCanvas.remove(activeObject);
  const radius = Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2);
  const roughCanvas = rough.canvas(fabricCanvas.lowerCanvasEl);
  roughCanvas.circle(start.x, start.y, radius * 2, {
    stroke: "black",
    roughness: 2,
  });
}

function drawRoughRectangle(start: fabric.Point, end: fabric.Point) {
  const activeObject = fabricCanvas.getActiveObject();
  if (activeObject) fabricCanvas.remove(activeObject);
  const roughCanvas = rough.canvas(fabricCanvas.lowerCanvasEl);
  roughCanvas.rectangle(start.x, start.y, end.x - start.x, end.y - start.y, {
    stroke: "black",
    roughness: 2,
  });
}

function drawRoughLine(start: fabric.Point, end: fabric.Point) {
  const activeObject = fabricCanvas.getActiveObject();
  if (activeObject) fabricCanvas.remove(activeObject);
  const roughCanvas = rough.canvas(fabricCanvas.lowerCanvasEl);
  roughCanvas.line(start.x, start.y, end.x, end.y, {
    stroke: "black",
    roughness: 2,
  });
}

function setMode(mode: (typeof drawingModes)[number]) {
  currentMode.value = mode;
  fabricCanvas.isDrawingMode = mode === "Draw";
  fabricCanvas.selection = mode === "Select";
  fabricCanvas.forEachObject((obj) => {
    obj.selectable = mode === "Select";
    obj.evented = mode === "Select";
  });
}

function clearCanvas() {
  fabricCanvas.clear();
}

function handleKeyEvent(e: any) {
  if (e.key === "Delete" && currentMode.value === "Select") {
    fabricCanvas.getActiveObjects().forEach((obj) => {
      fabricCanvas.remove(obj);
    });
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  }
}

onMounted(() => {
  initializeCanvas();
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

<style scoped>
.canvas-container {
  width: 100%;
  height: 100vh;
}

.toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
}

.mode-button,
.clear-button {
  margin-right: 5px;
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.mode-button {
  background-color: #4a5568;
  color: white;
}

.mode-button.active {
  background-color: #2b6cb0;
}

.clear-button {
  background-color: #e53e3e;
  color: white;
}
</style>
