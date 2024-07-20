<template>
  <div
    ref="canvasWrapper"
    tabIndex="1000"
    class="w-full h-full"
    @keypress="handleKeyEvent"
  >
    <button
      class="bg-blue-500 p-1 rounded"
      @click="() => (freedrawMode = !freedrawMode)"
    >
      {{ freedrawMode ? "Selection Mode" : "Draw Mode" }}
    </button>
    <canvas ref="canvas" class="" />
    <svg>
      <path v-if="points" d="pathData" />
    </svg>
  </div>
</template>

<script lang="js" setup>
import * as fabric from "fabric";
import { getStroke } from "perfect-freehand";
import { nanoid } from "nanoid";

const MAX_SCALE = 5;
const MIN_SCALE = 0.1;

const canvas = ref();
let fabricCanvas;
const canvasWrapper = ref();
const freedrawMode = ref(true);

onMounted(() => {
 fabricCanvas = new fabric.Canvas(canvas.value, {
    selection: !freedrawMode.value,
    skipTargetFind: freedrawMode.value,
    width: window.outerWidth,
    height: window.outerHeight,
    renderOnAddRemove: false,
  });

  if (freedrawMode.value) drawFreehand();

  fabricCanvas.on("mouse:wheel", function(opt) {
    let zoom = fabricCanvas.getZoom();
    zoom *= 0.999 ** opt.e.deltaY;
    if (zoom > MAX_SCALE) zoom = MAX_SCALE;
    if (zoom < MIN_SCALE) zoom = MIN_SCALE;

    fabricCanvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    fabricCanvas.requestRenderAll()
    opt.e.preventDefault();
    opt.e.stopPropagation();
  } );

});

watch(freedrawMode, () => {
 fabricCanvas.selection = !freedrawMode.value;
  fabricCanvas.skipTargetFind = freedrawMode.value;
});

let points = [];
function drawFreehand() {
  let isDrawing = false;
  let id = "";

 fabricCanvas.on("mouse:down", (options) => {
    if (!freedrawMode.value) return;
    if (fabricCanvas.getActiveObjects().length > 0)
     fabricCanvas.discardActiveObject();

    isDrawing = true;
    id = nanoid();
    points = [options.absolutePointer];
  });

  const throttledDrawFreehandPath = throttle(drawFreehandPath, 16);
 fabricCanvas.on("mouse:move", (options) => {
    if (!isDrawing) return;
    points.push(options.absolutePointer);
    throttledDrawFreehandPath(points, id);
  });


 fabricCanvas.on("mouse:up", () => {
    if (!isDrawing) return;
    isDrawing = false;
    drawFreehandPath(points, id);

    id = "";
    points = [];
  });
}

function drawFreehandPath(points, id) {
  const stroke = getStroke(points);
  const pathData = getFlatSvgPathFromStroke(stroke);

 fabricCanvas.remove(
   fabricCanvas.getObjects().find((obj) => obj.id === id)
  );

  const path = new fabric.Path(pathData, {
    fill: "black",
    stroke: "transparent",
    id: id,
  });

 fabricCanvas.add(path);
 fabricCanvas.requestRenderAll();
}

function handleKeyEvent(e) {
  if (e.key == "Delete") {
   fabricCanvas.getActiveObjects().forEach((element) => {
     fabricCanvas.remove(element);
    });
   fabricCanvas.discardActiveObject()
   fabricCanvas.requestRenderAll()
  }
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}
</script>

<style scoped>
canvas {
  border: 1px solid red;
}
</style>
