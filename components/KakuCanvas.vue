<template>
  <div
    ref="canvasWrapper"
    tabindex="1"
    class="w-full h-full bg-gray-950"
    @keydown="handleKeyEvent"
  >
    <div class="absolute bottom-2 right-2 z-[50] p-2 flex gap-1">
      <UButtonGroup class="border border-cyan-800 rounded">
        <UTooltip>
          <UButton
            to="https://github.com/supremedeity/kaku"
            target="_blank"
            icon="i-ph:github-logo-duotone"
            variant="soft"
            color="cyan"
          />
        </UTooltip>
        <UTooltip
          ><UButton
            class="border-l border-cyan-800"
            variant="soft"
            color="cyan"
            icon="i-ph:info-duotone"
          />
          <template #text
            ><span class="font-bold">Kaku</span> {{ " " }}
            <span class="text-cyan-400">{{ git_commit_sha }}</span></template
          ></UTooltip
        >
      </UButtonGroup>
    </div>
    <div
      v-if="!isContentVisible"
      class="absolute bottom-4 left-0 right-0 mx-auto z-[70] text-center"
    >
      <UButton
        variant="soft"
        color="cyan"
        class="border border-cyan-800"
        @click="scrollToContent"
        >Scroll to content</UButton
      >
    </div>
    <div class="absolute z-[70] bottom-4 left-4 sm:block hidden">
      <UButtonGroup
        size="sm"
        orientation="horizontal"
        class="border border-cyan-800 rounded"
      >
        <UTooltip text="Decrease zoom">
          <UButton
            icon="i-material-symbols-check-indeterminate-small"
            variant="soft"
            color="cyan"
            @click="
              () => {
                const zoom = fabricCanvas.getZoom() - 0.1;
                if (zoom < 0.1) return;
                fabricCanvas.setZoom(zoom);
                zoomLevel = zoom;
                fabricCanvas.requestRenderAll();
                saveViewportState();
              }
            "
        /></UTooltip>
        <UTooltip text="Reset zoom"
          ><UButton
            variant="soft"
            color="cyan"
            block
            class="border-l border-cyan-800 min-w-[68px]"
            :label="(zoomLevel * 100).toFixed(0) + '%'"
            @click="
              () => {
                const zoom = 1;
                fabricCanvas.setZoom(zoom);
                zoomLevel = zoom;
                fabricCanvas.requestRenderAll();
                saveViewportState();
              }
            "
        /></UTooltip>

        <UTooltip text="Increase zoom">
          <UButton
            variant="soft"
            color="cyan"
            icon="i-material-symbols-add"
            class="border-l border-cyan-800"
            @click="
              () => {
                const zoom = fabricCanvas.getZoom() + 0.1;
                if (zoom > 20) return;
                fabricCanvas.setZoom(zoom);
                zoomLevel = zoom;
                fabricCanvas.requestRenderAll();
                saveViewportState();
              }
            "
          />
        </UTooltip>
      </UButtonGroup>
    </div>
    <div
      class="absolute left-1/2 -translate-x-1/2 z-[70] top-3 flex items-center gap-1 bg-cyan-950 border border-cyan-800 sm:p-2 p-1.5 rounded"
    >
      <div v-for="mode in drawingModes" :key="mode">
        <UTooltip :text="mode">
          <button
            :class="[
              'flex items-center sm:p-2 p-1 text-white rounded transition-colors ',
              mode === currentMode
                ? 'bg-blue-400 hover:bg-blue-300'
                : 'bg-cyan-800 hover:bg-cyan-600',
            ]"
            @click="currentMode = mode"
          >
            <Icon :name="drawingModesIconMap[mode]" />
          </button>
        </UTooltip>
      </div>
      <div class="border border-cyan-800 sm:h-8 h-6" />

      <UDropdown
        :ui="{ container: 'z-[80] w-[220px]', wrapper: 'z-[80]' }"
        :items="dropdownItems"
        :popper="{ placement: 'bottom-start' }"
      >
        <template #exportImage>
          <div
            :class="{
              'opacity-50 pointer-events-none':
                fabricCanvas.getObjects().length <= 0,
            }"
            class="w-full flex items-center justify-between gap-1.5"
            @click="openExportModal"
          >
            <div class="flex items-center gap-1.5">
              <UIcon
                name="i-material-symbols-add-photo-alternate-outline-rounded"
                class="size-5 text-gray-500"
              />
              <span class="">Export Image</span>
            </div>
            <span class="flex gap-0.5 items-center">
              <UKbd>Ctrl</UKbd>
              <UKbd>E</UKbd>
            </span>
          </div>
        </template>
        <template #backgroundColor>
          <div class="flex justify-between w-full items-center">
            <span>Background Color</span
            ><ColorPicker
              v-model="canvasBgColor"
              preview-class="!size-5 rounded border border-gray-500"
              :value="fabricCanvas.backgroundColor as string"
              @change="(args: string) => canvasBgColor = args"
            />
          </div>
        </template>
        <button
          class="flex bg-cyan-800 text-white rounded sm:p-2 p-1 hover:bg-cyan-600 transition-colors"
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
      class="p-4 absolute left-4 top-16 z-[50] bg-cyan-950 rounded text-white min-w-52 border border-cyan-800 select-none"
    >
      <div>
        <span class="font-bold uppercase text-xs text-cyan-200">Stroke</span>
        <div>
          <ColorPicker
            :value="fabricCanvas.freeDrawingBrush?.color"
            @change="
              (val: any) => {
                if (fabricCanvas.freeDrawingBrush) {
                  fabricCanvas.freeDrawingBrush.color = val;
                  // Necessary to force pull new value of fabricCanvas.freeDrawingBrush.color
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
            (val: any) => {
              if (fabricCanvas.freeDrawingBrush?.freehandOptions)
                fabricCanvas.freeDrawingBrush.freehandOptions.size =
                  Number.parseInt(val);
            }
          "
        />
      </div>
    </div>
    <canvas ref="canvas" />
    <ExportImageModal
      :is-open="isExportModalOpen"
      :fabric-canvas="fabricCanvas"
      @update:is-open="isExportModalOpen = $event"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import { FabricObject } from "fabric";
import FontFaceObserver from "fontfaceobserver";
import { drawingModes, drawingModesIconMap } from "~/utils/constants";
import * as fabric from "fabric";

import CanvasHistory from "~/utils/fabric-history";
import PropertiesPanel from "./PropertiesPanel.vue";
import pako from "pako";

const runtimeConfig = useRuntimeConfig();
const git_commit_sha = runtimeConfig.public.commitSha;

const dropdownItems = [
  [
    {
      label: "Open",
      click: importScene,
      icon: "i-material-symbols-folder-open-outline-rounded",
      shortcuts: ["Ctrl", "O"],
    },
    {
      label: "Export Scene",
      click: exportScene,
      icon: "i-material-symbols-download",
      shortcuts: ["Ctrl", "S"],
    },
    {
      label: "Export as PNG",
      slot: "exportImage",
    },
  ],
  [
    {
      label: "Undo",
      icon: "i-ph-arrow-arc-left-duotone",
      shortcuts: ["Ctrl", "Z"],
      click: async () => {
        await history.undo();
      },
    },
    {
      label: "Redo",
      icon: "i-ph-arrow-arc-right-duotone",
      shortcuts: ["Ctrl", "Y"],
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
  [
    {
      label: "Background Color",
      slot: "backgroundColor",
      click: (e: any) => {
        e.preventDefault();
      },
    },
  ],
];

const canvasWrapper = ref(null);
const canvas: Ref<HTMLCanvasElement | undefined> = ref();
const selectedObjects = ref();
const canvasBgColor = ref("#030712");
let fabricCanvas: fabric.Canvas;
let history: CanvasHistory;
let _clipboard: any;

const currentMode: Ref<(typeof drawingModes)[number]> = ref("Select");
const isContentVisible: Ref<boolean> = ref(true);
const zoomLevel: Ref<number> = ref(1);

const isExportModalOpen = ref(false);
const openExportModal = () => {
  isExportModalOpen.value = true;
};

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
    backgroundColor: canvasBgColor.value,
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

    restoreViewportState();
    isContentVisible.value = checkContentVisible();
    zoomLevel.value = fabricCanvas.getZoom();
    canvasBgColor.value = fabricCanvas.backgroundColor as string;
  });

  window.addEventListener("resize", () => {
    fabricCanvas?.setDimensions({
      width: window.document.documentElement.clientWidth,
      height: window.document.documentElement.clientHeight,
    });
  });
  fabricCanvas.on("mouse:wheel", handleScroll);
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

  gestureDetector(fabricCanvas.upperCanvasEl, {
    onZoom(scale, previousScale, center) {
      fabricCanvas.selection = false;
      const zoom = fabricCanvas.getZoom();
      let newZoom = zoom * Math.pow(scale / previousScale, 1);
      newZoom = Math.min(newZoom, 20);
      newZoom = Math.max(newZoom, 0.1);

      fabricCanvas.zoomToPoint(center, newZoom);
      fabricCanvas.requestRenderAll();
    },
    onGestureEnd() {
      fabricCanvas.selection = currentMode.value === "Select";
    },
  });
}

function copy() {
  const activeObject = fabricCanvas.getActiveObject();
  if (!activeObject) return;

  _clipboard = activeObject.toJSON(); // Deep copy via JSON
}

async function paste() {
  const clone = await fabric.util.enlivenObjects([
    JSON.parse(JSON.stringify(_clipboard)),
  ]);

  const clonedObj = clone[0];
  if (
    !(
      clonedObj instanceof FabricObject ||
      clonedObj instanceof fabric.BaseFabricObject
    )
  )
    return;
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
    clonedObj.setCoords();
  } else {
    // @ts-expect-error just fabric having horrendous type-coherence
    fabricCanvas.add(clonedObj);
  }
  _clipboard.top += 10;
  _clipboard.left += 10;
  // @ts-expect-error just fabric having horrendous type-coherence
  fabricCanvas.setActiveObject(clonedObj);
  fabricCanvas.requestRenderAll();
}

function handleScroll(opt: any) {
  const delta = opt.e.deltaY;
  const vpt = fabricCanvas.viewportTransform;
  // Zoom if Ctrl pressed
  if (opt.e.ctrlKey) {
    let zoom = fabricCanvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.1) zoom = 0.1;
    fabricCanvas.zoomToPoint(
      new fabric.Point(opt.e.offsetX, opt.e.offsetY),
      zoom
    );
    zoomLevel.value = zoom;
  }
  // Scroll canvas horizontally if Shift pressed
  else if (opt.e.shiftKey) {
    vpt[4] -= delta;
    isContentVisible.value = checkContentVisible();
    fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform);
  }
  // Otherwise just scroll vertically
  else {
    vpt[5] -= delta;
    isContentVisible.value = checkContentVisible();
    fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform);
  }

  fabricCanvas.requestRenderAll();
  opt.e.preventDefault();
  opt.e.stopPropagation();
  saveViewportState();
}

let shapePlacementMode = false;
let shape: FabricObject | undefined;
let startPoint: any;
let lastPosX: number;
let lastPosY: number;

function handleMouseDown(o: any) {
  const evt = o.e;
  // ON DRAGGING
  if (evt.button === 1 || currentMode.value === "Hand (Panning)") {
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
    lastPosX = e.clientX;
    lastPosY = e.clientY;

    fabricCanvas.setViewportTransform(fabricCanvas.viewportTransform);
    fabricCanvas.requestRenderAll();
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
    saveViewportState();
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
  fabricCanvas.requestRenderAll();

  isContentVisible.value = checkContentVisible();
}

function checkContentVisible() {
  const objects = fabricCanvas.getObjects();
  // We dont want to show the "Scroll to content" button if there is no content on screen
  if (objects.length === 0) return true;

  const visibleObjects = objects.filter((obj) => obj.isOnScreen());
  if (visibleObjects.length === 0) return false;
  return true;
}

function scrollToContent() {
  const object = fabricCanvas.item(0);
  if (!object) return;

  const zoom = fabricCanvas.getZoom();
  fabricCanvas.setZoom(1);
  const vpw = fabricCanvas.getWidth() / zoom;
  const vph = fabricCanvas.getHeight() / zoom;
  const x = object.left - vpw / 2; // x is the location where the top left of the viewport should be
  const y = object.top - vph / 2; // y idem
  fabricCanvas.absolutePan(new fabric.Point(x, y));
  fabricCanvas.setZoom(zoom);
  fabricCanvas.requestRenderAll();
  isContentVisible.value = true;

  saveViewportState();
}

function importScene() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".kaku"; // Restrict to .kaku files only

  fileInput.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];

    if (!file) return; // No file selected

    if (!file.name.endsWith(".kaku")) {
      alert("Invalid file type! Please select a .kaku file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const decompressed = pako.inflate(
          new Uint8Array(reader.result as ArrayBuffer),
          {
            to: "string",
          }
        );
        const sceneData = JSON.parse(decompressed);
        console.log(sceneData);

        // Load canvas objects
        await fabricCanvas.loadFromJSON(sceneData.objects, () => {
          if (sceneData.viewport) {
            const { viewportTransform, zoom, backgroundColor } =
              sceneData.viewport;
            fabricCanvas.setViewportTransform(viewportTransform);
            fabricCanvas.setZoom(zoom);
            zoomLevel.value = zoom;
            fabricCanvas.backgroundColor = backgroundColor;
          }
        });
        fabricCanvas.renderAll();
        saveViewportState();
        history._saveCanvasState();
      } catch (error) {
        alert("Failed to load scene. The file might be corrupted or invalid.");
        console.error("Error importing scene:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  fileInput.click();
}

function exportScene() {
  if (!fabricCanvas) return;

  const viewportState = {
    viewportTransform: fabricCanvas.viewportTransform,
    zoom: fabricCanvas.getZoom(),
    backgroundColor: fabricCanvas.backgroundColor,
  };

  const sceneData = {
    objects: fabricCanvas.toDatalessJSON(["name"]),
    viewport: viewportState,
  };

  const json = JSON.stringify(sceneData);
  const compressed = pako.deflate(json);
  const blob = new Blob([compressed], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "scene.kaku";
  a.click();
  URL.revokeObjectURL(url);
}

function saveViewportState() {
  if (localStorage) {
    const viewportState = {
      viewportTransform: fabricCanvas.viewportTransform,
      zoom: fabricCanvas.getZoom(),
      backgroundColor: fabricCanvas.backgroundColor,
    };
    localStorage.setItem("viewportState", JSON.stringify(viewportState));
  }
}

function restoreViewportState() {
  if (localStorage) {
    const viewportState = localStorage.getItem("viewportState");
    if (viewportState) {
      const { viewportTransform, zoom, backgroundColor } =
        JSON.parse(viewportState);
      if (viewportTransform) {
        fabricCanvas.viewportTransform = viewportTransform;
      }
      if (zoom !== null) {
        fabricCanvas.setZoom(zoom);
      }
      if (backgroundColor) {
        fabricCanvas.backgroundColor = backgroundColor;
      }
      fabricCanvas.requestRenderAll();
    }
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
    e.preventDefault();
    await history.undo();
  } else if (e.ctrlKey && e.key === "y") {
    e.preventDefault();
    await history.redo();
  } else if (e.ctrlKey && e.key === "c") {
    e.preventDefault();
    copy();
  } else if (e.ctrlKey && e.key === "v") {
    e.preventDefault();
    await paste();
  } else if (e.ctrlKey && e.key === "o") {
    e.preventDefault();
    importScene();
  } else if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    exportScene();
  } else if (e.ctrlKey && e.key === "e") {
    e.preventDefault();
    openExportModal();
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
          const img = await fabric.FabricImage.fromURL(
            reader.result as string,
            {},
            { objectCaching: true }
          );
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
  if (confirm("Clear the canvas?")) {
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

watch(canvasBgColor, (newColor) => {
  fabricCanvas.backgroundColor = newColor;
  fabricCanvas.requestRenderAll();
  saveViewportState();
});
</script>
