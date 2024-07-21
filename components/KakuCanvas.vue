<template>
  <div class="canvas-container">
    <div
      ref="canvasWrapper"
      tabindex="1000"
      class="w-full h-full"
      @keydown="handleKeyEvent"
    >
      <button class="bg-blue-500 p-1 rounded" @click="toggleDrawMode">
        {{ isDrawingMode ? "Selection Mode" : "Draw Mode" }}
      </button>
      <button class="bg-red-500 p-1 rounded" @click="clearCanvas">
        Clear Canvas
      </button>
      <canvas ref="canvas" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as fabric from "fabric";

const canvasWrapper = ref(null);
const canvas = ref(null);
let fabricCanvas = null;
const isDrawingMode = ref(true);

const easingObj = {
  linear: (t) => t,
  easeOutQuint: (t) => 1 + --t * t * t * t * t,
};

const brushSettings = {
  cap: false,
  thinning: 0.38,
  streamline: 0.5,
  smoothing: 0.64,
  taperStart: 49,
  taperEnd: 69,
  tolerance: 0.01,
  highQuality: true,
  generalEasing: easingObj.linear,
  easingStart: easingObj.easeOutQuint,
  easingEnd: easingObj.easeOutQuint,
};

function initializeCanvas() {
  fabricCanvas = new fabric.Canvas(canvas.value, {
    isDrawingMode: isDrawingMode.value,
    preserveObjectStacking: true,
    enableRetinaScaling: false,
    width: window.innerWidth,
    height: window.innerHeight,
  });

  customizePencilBrush(brushSettings);

  const customBrush = new fabric.PencilBrush(fabricCanvas);
  fabricCanvas.freeDrawingBrush = customBrush;
  customBrush.color = "black";
  customBrush.width = 8;
  fabricCanvas.freeDrawingBrush.shadow = new fabric.Shadow({
    blur: 0,
    offsetX: 0,
    offsetY: 0,
    affectStroke: true,
    color: "black",
  });

  fabricCanvas.on("mouse:wheel", function (opt) {
    let zoom = fabricCanvas.getZoom();
    zoom *= 0.999 ** opt.e.deltaY;
    if (zoom > 5) zoom = 5;
    if (zoom < 0.1) zoom = 0.1;

    fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    fabricCanvas.requestRenderAll();
    opt.e.preventDefault();
    opt.e.stopPropagation();
  });
}

onMounted(() => {
  initializeCanvas();
});

onUnmounted(() => {
  if (fabricCanvas) {
    fabricCanvas.dispose();
  }
});

function toggleDrawMode() {
  isDrawingMode.value = !isDrawingMode.value;
  fabricCanvas.isDrawingMode = isDrawingMode.value;
}

function clearCanvas() {
  fabricCanvas.clear();
}

function handleKeyEvent(e) {
  if (e.key === "Delete") {
    fabricCanvas.getActiveObjects().forEach((obj) => {
      fabricCanvas.remove(obj);
    });
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  }
}
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100vh;
}
</style>
