<template>
  <div
    ref="canvasWrapper"
    tabindex="1000"
    class="w-full h-full bg-gray-900"
    @keydown="handleKeyEvent"
  >
    <div
      class="absolute left-1/2 -translate-x-1/2 z-[1000] top-3 flex gap-1 bg-gray-500 p-2 rounded"
    >
      <button
        v-for="mode in drawingModes"
        :key="mode"
        :class="[
          'flex items-center p-2 bg-gray-900 text-white rounded hover:bg-gray-800/60 transition-colors',
          mode === currentMode ? 'bg-blue-400 hover:bg-blue-300' : '',
        ]"
        @click="setMode(mode)"
      >
        <Icon :name="drawingModesIconMap[mode]" />
      </button>
      <button
        class="flex bg-rose-700 text-white rounded p-2 hover:bg-rose-600/80 transition-colors"
        @click="clearCanvas"
      >
        <Icon name="ph:trash-duotone" />
      </button>
    </div>
    <canvas ref="canvas" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import * as fabric from "fabric";
import type { FabricObject } from "fabric";
import FontFaceObserver from "fontfaceobserver";
import type { Options } from "roughjs/bin/core";
const canvasWrapper = ref(null);
const canvas: Ref<HTMLCanvasElement | undefined> = ref();
let fabricCanvas: fabric.Canvas;
const drawingModes = [
  "Select",
  "Draw",
  "Ellipse",
  "Rectangle",
  "Diamond",
  "Text",
  "Line",
] as const;

const drawingModesIconMap = {
  Select: "ph:cursor-duotone",
  Draw: "ph:pencil-duotone",
  Ellipse: "ph:circle-bold",
  Rectangle: "ph:rectangle-bold",
  Diamond: "ph:diamond-bold",
  Text: "ph:text-t-bold",
  Line: "ph:line-vertical-bold",
};

const currentMode: Ref<(typeof drawingModes)[number]> = ref("Draw");
const fonts = ["Kalam", "Itim", "Virgil"];

const brushSettings = {
  color: "white",
  size: 16,
  thinning: 0.6,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: any) => Math.sin((t * Math.PI) / 2),
  simulatePressure: true,
};
interface roughShapeProps {
  roughOptions: Partial<Options>;
}
const defaultShapeSettings: Partial<fabric.FabricObjectProps> &
  roughShapeProps = {
  evented: false,
  selectable: false,
  originX: "center",
  originY: "center",
  stroke: "white",
  strokeWidth: 2,
  roughOptions: {
    stroke: "white",
    roughness: 2,
    bowing: 1,
    strokeWidth: 2,
    seed: Math.random() * 100,
    curveFitting: 1,
  },
};

function initializeCanvas() {
  fabricCanvas = new fabric.Canvas(canvas.value, {
    isDrawingMode: currentMode.value === "Draw",
    preserveObjectStacking: true,
    width: window.innerWidth,
    height: window.innerHeight,
    renderOnAddRemove: false,
    selection: currentMode.value === "Select",
    backgroundColor: "#111827",
  });
  // customizePencilBrush(brushSettings);
  const perfectFreehandBrush = new PerfectFreehandBrush(fabricCanvas);
  fabricCanvas.freeDrawingBrush = perfectFreehandBrush;
  perfectFreehandBrush.setOptions(brushSettings);
  perfectFreehandBrush.color = brushSettings.color;
  perfectFreehandBrush.width = 8;
  // setBrush();

  fonts.forEach(async (f) => {
    const font = new FontFaceObserver(f);
    await font.load(null, 5000);
  });

  fabricCanvas.on("mouse:wheel", handleZoom);
  fabricCanvas.on("mouse:down:before", handleMouseDown);
  fabricCanvas.on("mouse:move", handleMouseMove);
  fabricCanvas.on("mouse:up", handleMouseUp);
  fabricCanvas.requestRenderAll();
}

function handleZoom(opt: any) {
  const delta = opt.e.deltaY;
  let zoom = fabricCanvas.getZoom();
  console.log(zoom);
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
  if (evt.shiftKey === true) {
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
      left: pointer.x,
      top: pointer.y,
      fontFamily: "Kalam",
      fontSize: 20,
      fill: "black",
      editable: true,
      selectable: true,
      width: 100,
      activeOn: "up", // fabric@6.3.0 bug: cant edit without this
    });
    text.selectAll();
    text.enterEditing();
    fabricCanvas.add(text);
    fabricCanvas.requestRenderAll();
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
  } else if (shapePlacementMode) {
    shapePlacementMode = false;
    shape?.setCoords();
    shape = undefined;
    fabricCanvas.requestRenderAll();
    currentMode.value = "Select";
  }
}

function handleShapePlacement(o: any) {
  const pointer = fabricCanvas.getScenePoint(o.e);
  switch (currentMode.value) {
    case "Line":
      shape = drawRoughLine(startPoint, pointer);
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
  const line = new FabricRoughLine([start.x, start.y, end.x, end.y], {
    ...defaultShapeSettings,
    originX: 0,
    originY: 0,
    lockScalingX: true,
    lockScalingY: true,
  });
  fabricCanvas.add(line);
  shape = line;
  fabricCanvas.requestRenderAll();
  return line;
}

function drawRoughEllipse(start: fabric.Point, end: fabric.Point) {
  if (shape) {
    // @ts-expect-error type THIS later
    shape.setPoints([start.x, start.y, end.x, end.y]);
    fabricCanvas.requestRenderAll();
    return shape;
  }
  const ellipse = new FabricRoughEllipse([start.x, start.y, end.x, end.y], {
    ...defaultShapeSettings,
    originX: 0,
    originY: 0,
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
  const rectangle = new FabricRoughRectangle([start.x, start.y, end.x, end.y], {
    ...defaultShapeSettings,
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
  const diamond = new FabricRoughDiamond([start.x, start.y, end.x, end.y], {
    ...defaultShapeSettings,
    originX: 0,
    originY: 0,
  });
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

async function handleKeyEvent(e: any) {
  if (e.key === "Delete" && currentMode.value === "Select") {
    fabricCanvas.getActiveObjects().forEach((obj) => {
      fabricCanvas.remove(obj);
    });
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();
  } else if (e.key === "Enter" && currentMode.value === "Select") {
    const activeObject = fabricCanvas.getActiveObjects();
    if (
      activeObject.length === 1 &&
      (activeObject[0] instanceof FabricRoughRectangle ||
        activeObject[0] instanceof FabricRoughEllipse ||
        activeObject[0] instanceof FabricRoughDiamond)
    ) {
      const group = new fabric.Group([], {
        subTargetCheck: true,
      });
      const shape = await activeObject[0].clone();
      const text = new fabric.Textbox("Edit text", {
        fontFamily: "Kalam",
        left: shape.left,
        top: shape.top,
        textAlign: "center",
        width: shape.width,
        height: shape.height,
        originX: shape.originX,
        originY: shape.originY,
      });
      group.add(shape, text);

      // This is a special case where editing text is quite awkward without doing this hack
      text.on("editing:exited", () => {
        fabricCanvas.discardActiveObject();
        group.add(text);
        fabricCanvas.remove(text);
        fabricCanvas.requestRenderAll();
      });

      text.on("changed", () => {
        if (
          group.item(0).height < text.height ||
          group.item(0).width < text.width
        ) {
          console.log(text.width, text.height);
          group
            .item(0)
            // @ts-expect-error custom function
            .updateRoughOptions({
              size: { height: text.height, width: text.width },
            });
        }
      });

      // group.on("scaling", () => {
      //   text.set({ width: group.width, dirty: true });

      //   fabricCanvas.requestRenderAll();
      // });

      group.on("mousedblclick", () => {
        const iText = group.item(1) as fabric.Textbox;
        fabricCanvas.add(...group.remove(iText));
        fabricCanvas.setActiveObject(iText);
        iText.enterEditing();
        iText.selectAll();
        fabricCanvas.requestRenderAll();
      });
      fabricCanvas.add(group);
      fabricCanvas.remove(activeObject[0]);
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }
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
