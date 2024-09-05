import * as fabric from "fabric";
import rough from "roughjs";

export class FabricRoughRectangle extends fabric.Rect {
    static get type() {
        return 'FabricRoughRectangle';
    }
    constructor(options = {}) {
        super(options);
        this.name = "Rectangle";
        this.points = options.points;
        this.roughOptions.seed = this.roughOptions.seed ?? Math.random() * 100;
        this.minSize = options.minSize || 5; // Minimum size of the rectangle
        this.roughGenerator = rough.generator();
        this._updateRoughRectangle();
    }

    _updateRoughRectangle() {
        const [x1, y1, x2, y2] = this.points;

        let width = this.roughOptions.size?.width ?? Math.abs(x2 - x1);
        let height = this.roughOptions.size?.height ?? Math.abs(y2 - y1);
        // Ensure minimum size
        width = Math.max(width, this.minSize);
        height = Math.max(height, this.minSize);
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);

        this.set({
            left: this.roughOptions.size ? 0 : left + width / 2,
            top: this.roughOptions.size ? 0 : top + height / 2,
            width: width,
            height: height,
        });

        this.roughRectangle = this.roughGenerator.rectangle(
            0,
            0,
            width,
            height,
            this.roughOptions
        );
        this.setCoords();
    }

    _render(ctx) {
        ctx.save();
        ctx.translate(-this.width / 2, -this.height / 2);

        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughRectangle);

        ctx.restore();
    }

    setPoints(points) {
        this.set({ points: points, dirty: true })
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
            minSize: this.minSize
        };
    }
}

fabric.classRegistry.setClass(FabricRoughRectangle);
fabric.classRegistry.setSVGClass(FabricRoughRectangle);