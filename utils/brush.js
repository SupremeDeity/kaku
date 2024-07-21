import simplifyJs from "simplify-js";
import { getStroke } from "perfect-freehand";
import { getSmoothPathFromPoints } from "./svg"
import * as fabric from "fabric"

export function customizePencilBrush(brushSettings) {
  fabric.PencilBrush.prototype._render = function (
    ctx = this.canvas.contextTop
  ) {
    ctx.save();

    const points = simplifyJs(
      this._points,
      brushSettings.tolerance,
      brushSettings.highQuality
    );
    const formattedPoints = points.map((point) => [
      point.x,
      point.y,
      point.pressure || 0.5,
    ]);

    const stroke = getStroke(formattedPoints, {
      size: this.width,
      thinning: brushSettings.thinning,
      streamline: brushSettings.streamline,
      smoothing: brushSettings.smoothing,
      easing: brushSettings.generalEasing,
      start: {
        cap: brushSettings.cap,
        taper: brushSettings.taperStart,
        easing: brushSettings.easingStart,
      },
      end: {
        cap: brushSettings.cap,
        taper: brushSettings.taperEnd,
        easing: brushSettings.easingEnd,
      },
      simulatePressure: false,
    });

    ctx.beginPath();
    if (stroke.length > 0) {
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 1; i < stroke.length; i++) {
        const midPoint = {
          x: (stroke[i - 1][0] + stroke[i][0]) / 2,
          y: (stroke[i - 1][1] + stroke[i][1]) / 2,
        };
        ctx.quadraticCurveTo(
          stroke[i - 1][0],
          stroke[i - 1][1],
          midPoint.x,
          midPoint.y
        );
      }
      ctx.quadraticCurveTo(
        stroke[stroke.length - 1][0],
        stroke[stroke.length - 1][1],
        stroke[stroke.length - 1][0],
        stroke[stroke.length - 1][1]
      );
      ctx.fillStyle = this.color;
      ctx.fill();
    }

    ctx.restore();
    this._resetShadow();
  };

  fabric.PencilBrush.prototype._finalizeAndAddPath = function () {
    const ctx = this.canvas.contextTop;
    ctx.closePath();

    const points = simplifyJs(
      this._points,
      brushSettings.tolerance,
      brushSettings.highQuality
    );
    const formattedPoints = points.map((point) => [
      point.x,
      point.y,
      point.pressure || 0.5,
    ]);
    const stroke = getStroke(formattedPoints, {
      size: this.width,
      thinning: brushSettings.thinning,
      streamline: brushSettings.streamline,
      smoothing: brushSettings.smoothing,
      easing: brushSettings.generalEasing,
      start: {
        cap: brushSettings.cap,
        taper: brushSettings.taperStart,
        easing: brushSettings.easingStart,
      },
      end: {
        cap: brushSettings.cap,
        taper: brushSettings.taperEnd,
        easing: brushSettings.easingEnd,
      },
      simulatePressure: false,
    });

    const strokePoints = stroke.map(([x, y]) => ({ x, y }));
    const pathData = getSmoothPathFromPoints(strokePoints);

    if (
      !pathData ||
      pathData.length === 0 ||
      pathData.some((cmd) => cmd.includes(NaN))
    ) {
      this.canvas.requestRenderAll();
      return;
    }

    const path = new fabric.Path(pathData, {
      fill: this.color,
      stroke: this.color,
      strokeWidth: 0,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });

    if (this.shadow) {
      this.shadow.affectStroke = true;
      path.shadow = new fabric.Shadow(this.shadow);
    }

    this.canvas.clearContext(this.canvas.contextTop);
    this.canvas.add(path);
    this.canvas.requestRenderAll();
    path.setCoords();
    this._resetShadow();
  };
}