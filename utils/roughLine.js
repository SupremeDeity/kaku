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
        this.on("modifyPath", (t) => {
            console.log(t);
            this.editing = true;
            this._updateRoughLine();
            this.editing = false;
        });
    }

    _createPathData(points) {
        const [x1, y1, x2, y2] = points;
        return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    _updateRoughLine() {
        if (this.isDrawing) {
            const [x1, y1, x2, y2] = this.points;
            const points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
            const bounds = fabric.util.makeBoundingBoxFromPoints(points);

            // Calculate the sign of width and height
            const widthSign = x2 >= x1 ? 1 : -1;
            const heightSign = y2 >= y1 ? 1 : -1;

            const originX = widthSign < 0 ? "right" : "left";
            const originY = heightSign < 0 ? "bottom" : "top";
            // Gets the top and left based on set origin
            const relativeCenter = this.getRelativeCenterPoint();
            // Translates the relativeCenter point as if origin = 0,0
            const constraint = this.translateToOriginPoint(
                relativeCenter,
                originX,
                originY
            );
            this.set({
                width: Math.abs(bounds.width),
                height: Math.abs(bounds.height),
            });
            // Put shape back in place
            this.setPositionByOrigin(constraint, originX, originY);

            const pathData = this._createPathData([
                -bounds.width / 2 * widthSign,
                -bounds.height / 2 * heightSign,
                bounds.width / 2 * widthSign,
                bounds.height / 2 * heightSign,
            ]);

            this.path = fabric.util.parsePath(pathData);
        }
        else {
            const widthSign = this.path[0][1] >= this.path[1][1] ? -1 : 1;
            const heightSign = this.path[0][2] >= this.path[1][2] ? -1 : 1;
            const pathData = this._createPathData([
                -this.width / 2 * widthSign,
                -this.height / 2 * heightSign,
                this.width / 2 * widthSign,
                this.height / 2 * heightSign,
            ]);
            this.setCoords();
            this.path = fabric.util.parsePath(pathData);
        }
        console.log(this.path);
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
            editing: this.editing,
            path: this.path,
            points: this.points,
            roughOptions: this.roughOptions,
        };
    }
}
fabric.classRegistry.setClass(FabricRoughLine);
fabric.classRegistry.setSVGClass(FabricRoughLine);
