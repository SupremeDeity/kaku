import * as fabric from "fabric";

class CanvasHistory {
  constructor(canvas) {
    this.canvas = canvas;
    this.history = [];
    this.historyRedo = [];
    this._isClearingCanvas = false; // Flag to avoid tracking during canvas clearing
  }

  async init() {
    await this._loadCanvasState()
    this._saveCanvasState(); // Save initial state
  }

  _saveCanvasState() {
    const jsonCanvas = structuredClone(this.canvas.toObject(["name", "padding"]).objects)
    this.history.push(jsonCanvas);

    this._saveChangesToLocal(jsonCanvas)
  }

  _saveChangesToLocal(canvas) {
    if (localStorage) {
      try {
        localStorage.setItem("canvasState", JSON.stringify(canvas))
      }
      catch (e) {
        console.log(e)
      }
    }
  }

  _clearCanvas() {
    this._isClearingCanvas = true;
    this.canvas.remove(...this.canvas.getObjects());
    this._isClearingCanvas = false;
  }

  async undo() {
    if (this.history.length <= 1) return; // Prevent undoing beyond the initial state

    this._clearCanvas();

    this.historyRedo.push(this.history.pop()); // Remove the current state
    console.log(this.historyRedo)
    const lastState = this.history[this.history.length - 1];
    this._saveChangesToLocal(lastState)
    const objects = await fabric.util.enlivenObjects(lastState);

    this._applyState(objects)
  }

  async redo() {
    if (this.historyRedo.length === 0) return; // Prevent undoing beyond the initial state
    console.log(this.historyRedo)
    this._clearCanvas();
    const lastState = this.historyRedo.pop();
    this.history.push(lastState)
    this._saveChangesToLocal(lastState)
    const objects = await fabric.util.enlivenObjects(lastState);

    this._applyState(objects)
  }

  // loads canvas state from localstorage
  async _loadCanvasState() {
    if (localStorage) {
      const canvasState = localStorage.getItem("canvasState");
      if (!canvasState) return;
      const objects = await fabric.util.enlivenObjects(JSON.parse(canvasState));
      this._applyState(objects)
    }
  }

  _applyState(objects) {
    this.canvas.off("custom:added");
    this.canvas.off("object:modified");
    this.canvas.off("object:removed");

    objects.forEach((obj) => {
      this.canvas.add(obj)
    });

    // Re-enable event listeners
    this.canvas.on("custom:added", () => this._saveCanvasState());
    this.canvas.on("object:modified", () => this._saveCanvasState());
    this.canvas.on("object:removed", () => {
      if (!this._isClearingCanvas) {
        this._saveCanvasState();
      }
    });
    this.canvas.renderAll()
  }
}

export default CanvasHistory;
