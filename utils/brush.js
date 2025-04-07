import { getStroke } from "perfect-freehand";
import * as fabric from "fabric";

export class PerfectFreehandBrush extends fabric.BaseBrush {
  constructor(canvas) {
    super(canvas);
    this.points = [];
    this.viewportTransform = null;
    this.strokePath = null;
    this.isMultiTouch = false;
  }

  onMouseDown(pointer, o) {
    const evt = o.e;

    if (this.isMultiTouch) return;
    if (evt.pointerType === "touch" && !evt.isPrimary) {
      this.isMultiTouch = true;
      this._abortDrawing();
      return;
    }

    this.freehandOptions.simulatePressure = evt.pressure !== undefined;
    const pressure = evt.pressure || 0.5;
    this.strokePath = null;
    this.points = []
    this.points.push({ x: pointer.x, y: pointer.y, pressure });
    this.viewportTransform = this.canvas.viewportTransform;
    this._render();
  }

  onMouseMove(pointer, o) {
    const evt = o.e;

    if (this.isMultiTouch) return;
    if (evt.pointerType === "touch" && !evt.isPrimary) {
      this.isMultiTouch = true; // Mark as multi-touch
      this._abortDrawing();
      return;
    }

    this.viewportTransform = this.canvas.viewportTransform;
    const pressure = evt.pressure || 0.5;
    this.points.push({ x: pointer.x, y: pointer.y, pressure });
    this._render();
  }

  onMouseUp(o) {
    const evt = o.e;
    // Reset multi-touch state
    if (evt.pointerType === "touch") {
      this.isMultiTouch = false;
    }

    if (this.isMultiTouch) {
      this._abortDrawing();
      return;
    }

    this._finalizeAndAddPath();
  }

  _abortDrawing() {
    // Clear any temporary drawing
    this.canvas.clearContext(this.canvas.contextTop);
    this.canvas.requestRenderAll();
    this.points = [];
    this.strokePath = null;
  }

  _render() {
    const ctx = this.canvas.contextTop;
    ctx.save();
    ctx.transform(...this.viewportTransform);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const stroke = getStroke(this.points, this.freehandOptions);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (const [x, y] of stroke) {
      ctx.lineTo(x, y);
    }
    ctx.fill();
    ctx.restore();
    this.strokePath = stroke;
  }

  _finalizeAndAddPath() {
    if (!this.strokePath) return;
    const pathData = this.getSvgPathFromStroke(this.strokePath);

    const path = new fabric.Path(pathData, {
      fill: this.color,
      stroke: this.color,
      strokeWidth: 0,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });
    path.name = "Drawing";

    this.canvas.add(path);
    this.canvas.fire("custom:added");
    this.canvas.clearContext(this.canvas.contextTop);
    this.canvas.requestRenderAll();
    this.points = [];
    this.strokePath = null;
  }

  med(A, B) {
    return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  }
  getSvgPathFromStroke(points) {
    if (!points.length) {
      return "";
    }

    const TO_FIXED_PRECISION =
      /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;
    const max = points.length - 1;

    return points
      .reduce(
        (acc, point, i, arr) => {
          if (i === max) {
            acc.push(point, this.med(point, arr[0]), "L", arr[0], "Z");
          } else {
            acc.push(point, this.med(point, arr[i + 1]));
          }
          return acc;
        },
        ["M", points[0], "Q"]
      )
      .join(" ")
      .replace(TO_FIXED_PRECISION, "$1");
  }

  setOptions(options) {
    this.freehandOptions = { ...this.freehandOptions, ...options };
  }
}
