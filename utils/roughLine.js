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
        this.midpoint = [0, 0]
        this._updateRoughLine();
        delete this.controls.mt;
        delete this.controls.mb;
        delete this.controls.ml;
        delete this.controls.mr;
    }

    _updateRoughLine() {
        const [x1, y1, x2, y2] = this.points;
        const [midpointX, midpointY] = this.midpoint;

        const widthOffset = this.left === x1 ? 0 : this.left - x1;
        const heightOffset = this.top === y1 ? 0 : this.top - y1;
        let width = x2 - this.left + widthOffset;
        let height = y2 - this.top + heightOffset;

        let midX = midpointX === 0 ? (x1 + x2) / 2 : midpointX;
        let midY = midpointY === 0 ? (y1 + y2) / 2 : midpointY;

        this.roughLine = this.roughGenerator.curve(
            [
                [-width / 2, -height / 2],
                [midX - this.left, midY - this.top],
                [width / 2, height / 2],
            ],
            this.roughOptions
        );

        const originX = Math.sign(width) < 0 ? "right" : "left";
        const originY = Math.sign(height) < 0 ? "bottom" : "top";

        const relativeCenter = this.getRelativeCenterPoint();
        const constraint = this.translateToOriginPoint(
            relativeCenter,
            originX,
            originY
        );

        const minX = Math.min(x1, x2, midX);
        const minY = Math.min(y1, y2, midY);
        const maxX = Math.max(x1, x2, midX);
        const maxY = Math.max(y1, y2, midY);

        // Set width and height based on the bounding box
        width = maxX - minX;
        height = maxY - minY;

        this.set({
            width: Math.abs(width),
            height: Math.abs(height),
        });
        this.setPositionByOrigin(constraint, originX, originY);
        this.setCoords();

        this.controls.bendControls = new fabric.Control({
            cursorStyle: "pointer",
            x: (midX - this.left) / width, y: (midY - this.top) / height,
            actionHandler: (eventData) => {
                const pointer = this.canvas.getScenePoint(eventData);
                const midpointX = pointer.x;
                const midpointY = pointer.y;

                this.midpoint = [midpointX, midpointY];

                this.update();
                this.canvas.requestRenderAll();
                this.canvas.fire("object:modified");
            },
        });
        this.controls.bendControls = new fabric.Control({
            cursorStyle: "pointer",
            x: (midX - this.left) / width, y: (midY - this.top) / height,
            actionHandler: (eventData) => {
                const pointer = this.canvas.getScenePoint(eventData);
                const midpointX = pointer.x;
                const midpointY = pointer.y;

                this.midpoint = [midpointX, midpointY];

                this.update();
                this.canvas.requestRenderAll();
                this.canvas.fire("object:modified");
            },
        });
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
