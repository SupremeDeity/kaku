import * as fabric from "fabric";

class CanvasHistory {
  constructor(canvas) {
    this.canvas = canvas;
    this.history = [];
    this._isClearingCanvas = false; // Flag to avoid tracking during canvas clearing

    this._init();
  }

  _init() {
    this._saveCanvasState(); // Save initial state

    // Automatically save canvas state on object addition
    this.canvas.on("object:added", () => this._saveCanvasState());
    this.canvas.on("object:modified", () => this._saveCanvasState());

  }

  _saveCanvasState() {
    console.log("Called")
    const jsonCanvas = this.canvas.toObject();
    this.history.push(jsonCanvas);
  }

  _clearCanvas() {
    this.canvas.remove(...this.canvas.getObjects());
  }

  async undo() {
    if (this.history.length <= 1) return; // Prevent undoing beyond the initial state

    this._clearCanvas();
    this.history.pop(); // Remove the current state

    const lastState = this.history[this.history.length - 1];
    const objects = await fabric.util.enlivenObjects(lastState.objects);

    this.canvas.off("object:added"); // Temporarily disable event to avoid redundant saves
    this.canvas.off("object:modified"); // Temporarily disable event to avoid redundant saves
    objects.forEach((obj) => this.canvas.add(obj));
    this.canvas.on("object:added", () => this._saveCanvasState()); // Re-enable saving
    this.canvas.on("object:modified", () => this._saveCanvasState()); // Re-enable saving
    this.canvas.renderAll()
  }
}

export default CanvasHistory;
