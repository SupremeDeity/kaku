<template>
  <UModal
    :ui="{ wrapper: 'z-[100]', container: 'items-center' }"
    :model-value="isOpen"
    @update:model-value="handleUpdate"
  >
    <UCard>
      <!-- Image Preview -->
      <div
        class="flex min-w-sm max-h-52 justify-center border rounded border-gray-800 checkers"
      >
        <img
          :src="imagePreview"
          alt="Image Preview"
          class="rounded-lg object-contain"
        />
      </div>

      <!-- Controls -->
      <div class="mt-4 space-y-4 mx-2">
        <!-- Scale Multiplier Button Group -->
        <div class="flex items-center justify-between">
          <span class="font-bold">Scale</span>
          <UButtonGroup size="xs" color="cyan">
            <UButton
              v-for="scale in [1, 2, 3]"
              :key="scale"
              :label="`${scale}x`"
              :color="scale === multiplier ? 'primary' : 'gray'"
              @click="changeScale(scale)"
            />
          </UButtonGroup>
        </div>

        <div class="flex items-center justify-between font-bold">
          Invert Colors
          <UToggle
            v-model="invertColors"
            size="lg"
            label="Invert Colors"
            @change="updatePreview"
          />
        </div>

        <div class="flex items-center justify-between font-bold">
          Background
          <UToggle
            v-model="includeBackground"
            size="lg"
            label="Include Background"
            @change="updatePreview"
          />
        </div>
      </div>

      <!-- Download Button -->
      <template #footer>
        <div class="flex gap-2">
          <UButton @click="downloadImage"> Download </UButton>
          <UButton @click="copyToClipboard"> Copy to Clipboard </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import * as fabric from "fabric";

// Define props
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  fabricCanvas: {
    type: fabric.Canvas,
    default: null,
  },
});

const emit = defineEmits(["update:isOpen"]);

// Image preview URL
const imagePreview = ref("");

// Invert colors toggle
const invertColors = ref(false);

// Scale multiplier
const multiplier = ref(1);

// Include background toggle
const includeBackground = ref(false);

// Watch for changes to isOpen prop
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      updatePreview();
    }
  }
);

// Handle update event from UModal
const handleUpdate = (value: boolean) => {
  emit("update:isOpen", value);
};

const changeScale = (scale: number) => {
  multiplier.value = scale;
  updatePreview();
};

// Convert ActiveSelection to Image
const selectionToImage = (selection: fabric.ActiveSelection) => {
  return new Promise<fabric.FabricImage>((resolve) => {
    const canvas = selection.toCanvasElement({
      multiplier: multiplier.value,
      format: "png",
      left: -selection.width / 22,
      top: -selection.height / 22,
      width: selection.width * 1.1,
      height: selection.height * 1.1,
    });

    const img = new fabric.FabricImage(canvas);
    resolve(img);
  });
};

// Update the image preview
const updatePreview = async () => {
  const sel = new fabric.ActiveSelection(props.fabricCanvas.getObjects(), {
    canvas: props.fabricCanvas,
    backgroundColor: includeBackground.value
      ? (props.fabricCanvas.backgroundColor as string)
      : undefined,
  });

  if (sel.isEmpty()) return;

  // Convert selection to image
  const img = await selectionToImage(sel);

  // Invert colors if enabled
  if (invertColors.value) {
    img.filters.push(new fabric.filters.Invert());
    img.applyFilters();
  }

  // Generate the image preview
  imagePreview.value = img.toDataURL({
    format: "png",
    multiplier: multiplier.value,
  });
};

// Download the image
const downloadImage = () => {
  const link = document.createElement("a");
  link.download = "kaku-" + new Date().toISOString() + ".png";
  link.href = imagePreview.value;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Copy to clipboard
const copyToClipboard = async () => {
  const sel = new fabric.ActiveSelection(props.fabricCanvas.getObjects(), {
    canvas: props.fabricCanvas,
    backgroundColor: includeBackground.value
      ? (props.fabricCanvas.backgroundColor as string)
      : undefined,
  });

  if (sel.isEmpty()) return;

  // Convert selection to image
  const img = await selectionToImage(sel);

  // Invert colors if enabled
  if (invertColors.value) {
    img.filters.push(new fabric.filters.Invert());
    img.applyFilters();
  }

  // Generate the image data URL
  const dataURL = img.toDataURL({
    format: "png",
    multiplier: multiplier.value,
  });

  // Copy to clipboard
  try {
    const blob = await (await fetch(dataURL)).blob();
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    alert("Image copied to clipboard!");
  } catch (error) {
    console.error("Failed to copy image to clipboard:", error);
    alert("Failed to copy image to clipboard.");
  }
};
</script>

<style scoped>
.checkers {
  background-image: linear-gradient(45deg, #4a4a4a 25%, transparent 25%),
    linear-gradient(135deg, #4a4a4a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #4a4a4a 75%),
    linear-gradient(135deg, transparent 75%, #4a4a4a 75%);
  background-size: 15px 15px; /* Must be a square */
  background-position: 0 0, 7.5px 0, 7.5px -7.5px, 0px 7.5px;
}
</style>
