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
import type {FabricObject} from "fabric";
import FontFaceObserver from "fontfaceobserver";

const canvasWrapper = ref(null);
const canvas: Ref<HTMLCanvasElement | undefined> = ref();
let fabricCanvas: fabric.Canvas;
const drawingModes = ["Select", "Draw", "Circle", "Rectangle", "Diamond", "Text", "Line"] as const;
const currentMode: Ref<(typeof drawingModes)[number]> = ref("Draw");
const fonts = ["Kalam"];

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
    selection: currentMode.value === "Select"
  });

  customizePencilBrush(brushSettings);
  setBrush();

  fonts.forEach(async (f) => {
    const font = new FontFaceObserver(f);
    await font.load(null,  5000)
  })

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

let shapePlacementMode = false;
let shape: FabricObject | undefined;
let startPoint: any;
let lastPosX: number;
let lastPosY: number;

function handleMouseDown(o: any) {
  const evt = o.e;

  // ON DRAGGING
  if (evt.altKey === true) {
    fabricCanvas.isDrawingMode = false;
    // @ts-expect-error custom property added to fabricCanvas
    fabricCanvas.isDragging = true;
    fabricCanvas.selection = false;

    lastPosX = evt.clientX;
    lastPosY = evt.clientY;
  }
  // SHAPE PLACEMENT MODE
  else if (currentMode.value !== "Select" && currentMode.value !== "Draw" && currentMode.value !== "Text") {
    shapePlacementMode = true;
    startPoint = fabricCanvas.getScenePoint(o.e);
    handleShapePlacement(o)
  }

  // TEXT PLACEMENT MODE
  else if (currentMode.value === "Text") {
    const pointer = fabricCanvas.getScenePoint(o.e);
    const text = new fabric.Textbox('Edit text', {
      left: pointer.x,
      top: pointer.y,
      fontFamily: 'Kalam',
      fontSize: 20,
      fill: 'black',
      editable: true,
      selectable: true,
      width: 50,
      height: 50
    });
    fabricCanvas.add(text);
    currentMode.value = "Select";
    fabricCanvas.requestRenderAll();
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
  if(fabricCanvas.isDragging) {
    fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform);
    // @ts-expect-error custom property added to fabricCanvas
    fabricCanvas.isDragging = false;
    fabricCanvas.selection = currentMode.value === "Select";
    fabricCanvas.isDrawingMode = currentMode.value === "Draw";
  }

  else if(shapePlacementMode) {
    shapePlacementMode = false;
    shape?.setCoords();
    shape = undefined;
    fabricCanvas.requestRenderAll();
    currentMode.value = "Select"
  }
}

function handleShapePlacement(o: any) {
  const pointer = fabricCanvas.getScenePoint(o.e);

  switch (currentMode.value) {
    case "Line":
      shape = drawRoughLine(startPoint, pointer);
      break;
    case "Circle":
      shape = drawRoughCircle(startPoint, pointer);
      break;
    case "Rectangle":
      shape = drawRoughRectangle(startPoint, pointer);
      break;
    case "Diamond":
      shape = drawRoughDiamond(startPoint, pointer);
      break;
  }
}

function drawRoughLine(start: fabric.Point, end: fabric.Point) {
  if(shape) {
    // @ts-expect-error type THIS later
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const line = new FabricRoughLine([start.x, start.y, end.x, end.y], {
    roughOptions: { stroke: 'black', roughness: 2 }, evented: false, selectable: false
  });
  fabricCanvas.add(line);
  return line;
}

function drawRoughCircle(start: fabric.Point, end: fabric.Point) {
  if(shape) {
    // @ts-expect-error type THIS later
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const circle = new FabricRoughCircle([start.x, start.y, end.x, end.y], {evented: false, selectable: false, originX: 'center',
    originY: 'center' });
  fabricCanvas.add(circle);
  return circle;
}

function drawRoughRectangle(start: fabric.Point, end: fabric.Point) {
  if(shape) {
    // @ts-expect-error type THIS later
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const rectangle = new FabricRoughRectangle([start.x, start.y, end.x, end.y], {evented: false, selectable: false, originX: 'center',
    originY: 'center' });
  fabricCanvas.add(rectangle);
  return rectangle;
}

function drawRoughDiamond(start: fabric.Point, end: fabric.Point) {
  if(shape) {
    // @ts-expect-error type THIS later
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const diamond = new FabricRoughDiamond([start.x, start.y, end.x, end.y], {evented: false, selectable: false, originX: 'center',
    originY: 'center' });
  fabricCanvas.add(diamond);
  return diamond;
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
