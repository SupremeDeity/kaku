import { getStroke } from "perfect-freehand";
import * as fabric from "fabric";

export class PerfectFreehandBrush extends fabric.BaseBrush {
  constructor(canvas) {
    super(canvas);
    this.points = [];
    this.viewportTransform = null;
    this.strokePath = null;
  }

  onMouseDown(pointer) {
    this.points = [pointer];
    this.viewportTransform = this.canvas.viewportTransform;
    this._render();
  }

  onMouseMove(pointer) {
    this.points.push(pointer);
    this._render();
  }

  onMouseUp() {
    this._finalizeAndAddPath();
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

    console.time("path-creation")
    const path = new fabric.Path(pathData, {
      name: "Drawing",
      fill: this.color,
      stroke: this.color,
      strokeWidth: 0,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });
    console.timeEnd("path-creation")

    this.canvas.add(path);
    this.canvas.fire("custom:added")
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
