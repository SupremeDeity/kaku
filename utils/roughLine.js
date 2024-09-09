import * as fabric from "fabric";
import rough from "roughjs";

export class FabricRoughLine extends fabric.FabricObject {
    static get type() {
        return "FabricRoughLine";
    }
    constructor(options = {}) {
        super(options);
        this.name = "Line";
        this.points = options.points;
        this.roughOptions.seed = this.roughOptions.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator();
        this.left = this.left !== 0 ? this.left : options.points[0];
        this.top = this.top !== 0 ? this.top : options.points[1];
        this._updateRoughLine();
    }

    _updateRoughLine() {
        const [x1, y1, x2, y2] = this.points;
        const widthOffset = this.left === x1 ? 0 : this.left - x1;
        const heightOffset = this.top === y1 ? 0 : this.top - y1;
        let width = x2 - this.left + widthOffset;
        let height = y2 - this.top + heightOffset;

        const originX = Math.sign(width) < 0 ? "right" : "left";
        const originY = Math.sign(height) < 0 ? "bottom" : "top";

        // Gets the top and left based on set origin
        const relativeCenter = this.getRelativeCenterPoint();
        // Translates the relativeCenter point as if origin = 0,0
        const constraint = this.translateToOriginPoint(
            relativeCenter,
            originX,
            originY
        );
        this.set({
            width: Math.abs(width),
            height: Math.abs(height),
        });
        // Put shape back in place
        this.setPositionByOrigin(constraint, originX, originY);
        this.setCoords();
        this.roughLine = this.roughGenerator.line(
            -width / 2,
            -height / 2,
            width / 2,
            height / 2,
            this.roughOptions
        );
    }

    _render(ctx) {
        ctx.save();
        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughLine);
        ctx.restore();
    }

    setPoints(points) {
        this.points = points;
        this._updateRoughLine();
    }

    update() {
        this._updateRoughLine();
        this.dirty = true;
    }

    toObject(propertiesToInclude) {
        return {
            ...super.toObject(propertiesToInclude),
            points: this.points,
            roughOptions: this.roughOptions,
        };
    }
}
fabric.classRegistry.setClass(FabricRoughLine);
fabric.classRegistry.setSVGClass(FabricRoughLine);
