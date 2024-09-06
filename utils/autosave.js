import * as fabric from "fabric"
export class AutoSave {
  constructor(canvas) {
    this.canvas = canvas;
    this._init();
  }

  _init() {
    // Automatically save canvas state on object addition
    this.canvas.on("custom:added", () => this._saveCanvasState());
    this.canvas.on("object:modified", () => this._saveCanvasState());
    this.canvas.on("object:removed", () => {
      this._saveCanvasState();
    });
  }

  _saveCanvasState() {
    const jsonCanvas = JSON.stringify(this.canvas.toObject().objects);
    if (localStorage) {
      try {
        localStorage.setItem("canvasState", jsonCanvas)
      }
      catch (e) {
        console.log(e)
      }
    }
  }

  // loads canvas state from localstorage
  async loadCanvasState() {
    if (localStorage) {
      const canvasState = localStorage.getItem("canvasState");
      if (!canvasState) return;
      const objects = await fabric.util.enlivenObjects(JSON.parse(canvasState));
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
        this._saveCanvasState();
      });
      this.canvas.renderAll()
    }
  }

}