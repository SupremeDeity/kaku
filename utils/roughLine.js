import * as fabric from "fabric";
import rough from "roughjs";

export class FabricRoughLine extends fabric.Path {
    static get type() {
        return "FabricRoughLine";
    }
    constructor(path, options = {}) {
        super(path, options);
        this.name = "Line";
        this.points = options.points;
        this.roughOptions = options.roughOptions;
        this.roughOptions.seed = this.roughOptions?.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator();
        this.left = this.left !== 0 ? this.left : options.points[0];
        this.top = this.top !== 0 ? this.top : options.points[1];
        this._updateRoughLine();
    }

    _createPathData(points) {
        const [x1, y1, x2, y2] = points;
        return `M ${x1} ${y1} L ${x2} ${y2}`;
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
        const pathData = this._createPathData([
            -width / 2,
            -height / 2,
            width / 2,
            height / 2,
        ]);
        if (!this.editing) {
            this.path = fabric.util.parsePath(pathData);
        }
        this.controls = fabric.controlsUtils.createPathControls(
            this,
            {
                controlPointStyle: {
                    controlStroke: "slateblue",
                    controlFill: "slateblue",
                },
                pointStyle: {
                    controlStroke: "slateblue",
                    controlFill: "slateblue",
                },
            }
        );
        this.roughLine = this.roughGenerator.path(fabric.util.joinPath(this.path), this.roughOptions);
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
