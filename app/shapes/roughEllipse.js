import * as fabric from "fabric";
import rough from "roughjs";
import { generateUniqueId } from "../utils/roughutil";

export class FabricRoughEllipse extends fabric.Ellipse {
    static get type() {
        return 'FabricRoughEllipse';
    }
    constructor(options = {}) {
        super(options);
        this.name = "Ellipse"
        this.points = options.points;
        this.minSize = options.minSize || 5;
        this.roughOptions = this.roughOptions ?? options.roughOptions;


        this.id = options.id || generateUniqueId();

        this.roughOptions.seed = this.roughOptions.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator(this.roughOptions);
        this.left = (this.left !== null && this.left !== 0) ? this.left : options.points[0];
        this.top = (this.top !== null && this.top !== 0) ? this.top : options.points[1];
        this._updateRoughEllipse();
    }

    _updateRoughEllipse() {
        let [x1, y1, x2, y2] = this.points;

        const points = [
            { x: x1, y: y1 },
            { x: x2, y: y2 },
        ];
        const bounds = fabric.util.makeBoundingBoxFromPoints(points);
        const widthSign = x2 >= x1 ? 1 : -1;
        const heightSign = y2 >= y1 ? 1 : -1;

        const originX = widthSign < 0 ? "right" : "left";
        const originY = heightSign < 0 ? "bottom" : "top";
        // Gets the top and left based on set origin
        const relativeCenter = this.getRelativeCenterPoint()
        // Translates the relativeCenter point as if origin = 0,0
        const constraint = this.translateToOriginPoint(relativeCenter, originX, originY)

        this.set({
            width: bounds.width,
            height: bounds.height,
        });

        // Put shape back in place
        this.setPositionByOrigin(
            constraint,
            originX,
            originY,
        );

        this.roughEllipse = this.roughGenerator.ellipse(
            bounds.width / 2,
            bounds.height / 2,
            bounds.width,
            bounds.height,
            this.roughOptions
        );
        this.setCoords();
    }

    _render(ctx) {
        ctx.save();
        ctx.lineCap = "round"
        ctx.translate(-this.width / 2, -this.height / 2);

        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughEllipse);

        ctx.restore();
    }

    setPoints(points) {
        this.points = points;
        this._updateRoughEllipse();
    }

    // TODO: REMOVE THIS WHEN Group rework
    updateRoughOptions(newOptions) {
        this.roughOptions = { ...this.roughOptions, ...newOptions };
        this._updateRoughEllipse();
        this.dirty = true;
        this.canvas && this.canvas.requestRenderAll();
    }

    update() {
        this._updateRoughEllipse();
        this.dirty = true;
    }

    toObject(propertiesToInclude) {
        return {
            ...super.toObject(propertiesToInclude),
            id: this.id,
            points: this.points,
            roughOptions: this.roughOptions,
            minSize: this.minSize,
        };
    }
}

fabric.classRegistry.setClass(FabricRoughEllipse);
fabric.classRegistry.setSVGClass(FabricRoughEllipse);
