import simplifyJs from "simplify-js";
import { getStroke } from "perfect-freehand";
import { getSmoothPathFromPoints } from "./svg";
import * as fabric from "fabric";

/**
 * Trying to get points constantly and converting them to freedraw is not very performant.
 * This function takes advantage of fabric's drawing mode and customizes the default pencil brush.
 * It simply converts the brush strokes from the pencil brush to freedraw's stroke after mouse:up.
 * SimplifyJs is also being used to minify the points.
 */
export function customizePencilBrush(brushSettings: any) {
  fabric.PencilBrush.prototype._render = function (
      // @ts-expect-error expected error
    ctx = this.canvas.contextTop
  ) {
    ctx.save();

    const points = simplifyJs(
        // @ts-expect-error expected error due to overriding base class
        this._points.map(point => this.canvas.getViewportPoint(point)),
      brushSettings.tolerance,
      brushSettings.highQuality
    );
    const stroke = getStroke(points, {
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
      simulatePressure: true,
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
    // @ts-expect-error expected error
    this._resetShadow();
  };

  fabric.PencilBrush.prototype._finalizeAndAddPath = function () {
    const ctx = this.canvas.contextTop;
    ctx.closePath();

    const points = simplifyJs(
        // @ts-expect-error expected error
      this._points,
      brushSettings.tolerance,
      brushSettings.highQuality
    );
    const formattedPoints = points.map((point) => [point.x, point.y]);
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
      simulatePressure: true,
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
    path.setCoords();
    // @ts-expect-error expected error
    this._resetShadow();
    this.canvas.requestRenderAll();
  };
}
