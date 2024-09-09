import * as fabric from "fabric";
import rough from "roughjs";
import { calculateCornerRadius } from "./roughutil";

export class FabricRoughRectangle extends fabric.Rect {
    static get type() {
        return "FabricRoughRectangle";
    }
    constructor(options = {}) {
        super(options);
        this.name = "Rectangle";
        this.points = options.points;
        this.roughOptions.seed = this.roughOptions.seed ?? Math.random() * 100;
        this.minSize = options.minSize || 5; // Minimum size of the rectangle
        this.roughGenerator = rough.generator();
        this.left = this.left !== 0 ? this.left : options.points[0];
        this.top = this.top !== 0 ? this.top : options.points[1];
        this._updateRoughRectangle();
    }

    _updateRoughRectangle() {
        const [x1, y1, x2, y2] = this.points;

        const widthOffset = this.left === x1 ? 0 : this.left - x1;
        const heightOffset = this.top === y1 ? 0 : this.top - y1;
        let width = x2 - this.left + widthOffset;
        let height = y2 - this.top + heightOffset;

        const originX = Math.sign(width) < 0 ? "right" : "left";
        const originY = Math.sign(height) < 0 ? "bottom" : "top";
        width = Math.abs(width);
        height = Math.abs(height);

        // Gets the top and left based on set origin
        const relativeCenter = this.getRelativeCenterPoint();
        // Translates the relativeCenter point as if origin = 0,0
        const constraint = this.translateToOriginPoint(
            relativeCenter,
            originX,
            originY
        );

        // Shape changing stuff
        this.set({
            width: width,
            height: height,
        });

        const x = -this.width / 2;
        const y = -this.height / 2;
        this.roughOptions.preserveVertices = this.rounded;
        if (!this.rounded) {
            this.roughRectangle = this.roughGenerator.rectangle(
                x,
                y,
                width,
                height,
                this.roughOptions
            );
        } else {
            const radius = calculateCornerRadius(Math.min(width, height));
            const path = `
      M ${x + radius} ${y}
      h ${width - 2 * radius}
      a ${radius} ${radius} 0 0 1 ${radius} ${radius}
      v ${height - 2 * radius}
      a ${radius} ${radius} 0 0 1 -${radius} ${radius}
      h ${-(width - 2 * radius)}
      a ${radius} ${radius} 0 0 1 -${radius} -${radius}
      v ${-(height - 2 * radius)}
      a ${radius} ${radius} 0 0 1 ${radius} -${radius}
      z
    `;
            this.roughRectangle = this.roughGenerator.path(path, {
                ...this.roughOptions,
                roughness: (this.roughOptions.roughness < 1 ? 0 : this.roughOptions.roughness + 1)
                ,
            });
        }

        // Put shape back in place
        this.setPositionByOrigin(constraint, originX, originY);

        this.setCoords();
    }

    _render(ctx) {
        ctx.save();

        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughRectangle);

        ctx.restore();
    }

    setPoints(points) {
        this.set({ points: points, dirty: true });
        this._updateRoughRectangle();
    }

    // TODO: REMOVE THIS WHEN Group rework
    updateRoughOptions(newOptions) {
        this.roughOptions = { ...this.roughOptions, ...newOptions };
        this._updateRoughRectangle();
    }

    update() {
        this._updateRoughRectangle();
        this.dirty = true;
    }

    toObject(propertiesToInclude) {
        return {
            ...super.toObject(propertiesToInclude),
            points: this.points,
            roughOptions: this.roughOptions,
            minSize: this.minSize,
            rounded: this.rounded,
        };
    }
}

fabric.classRegistry.setClass(FabricRoughRectangle);
fabric.classRegistry.setSVGClass(FabricRoughRectangle);
