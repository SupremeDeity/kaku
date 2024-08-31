import { getStroke } from "perfect-freehand";
import * as fabric from "fabric";

export class PerfectFreehandBrush extends fabric.BaseBrush {
  constructor(canvas) {
    super(canvas);
    this.points = [];
    this.freehandOptions = {
      size: 16,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
      easing: (t) => t,
      start: { taper: 0, easing: (t) => t },
      end: { taper: 0, easing: (t) => t },
      simulatePressure: true,
    };
  }

  onMouseDown(pointer) {
    this.points = [pointer];
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
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const stroke = getStroke(this.points, this.freehandOptions);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    for (const [x, y] of stroke) {
      ctx.lineTo(x, y);
    }
    ctx.fill();
  }

  _finalizeAndAddPath() {
    if (this.points.length < 2) return;

    const stroke = getStroke(this.points, this.freehandOptions);
    const path = new fabric.Path(this.getSvgPathFromStroke(stroke), {
      fill: this.color,
      stroke: this.color,
      strokeWidth: 0,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
    });

    this.canvas.add(path);
    this.canvas.clearContext(this.canvas.contextTop);
    this.canvas.renderAll();
    this.canvas.fire('path:created', { path: path });
  }

  med(A, B) {
    return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  }
  
  getSvgPathFromStroke(points) {
    if (!points.length) {
      return "";
    }

    const TO_FIXED_PRECISION = /(\s?[A-Z]?,?-?[0-9]*\.[0-9]{0,2})(([0-9]|e|-)*)/g;
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
