import * as fabric from 'fabric';
import rough from 'roughjs';

export class FabricRoughCircle extends fabric.Circle {
    static type = 'FabricRoughCircle';

    constructor(points, options = {}) {
        super(options);
        this.points = points || [0, 0, 100, 100];
        this.roughOptions = {
            stroke: 'black',
            strokeWidth: 4,
            fill: 'transparent',
            roughness: 2,
            seed: Math.random() * 100,
            ...options.roughOptions
        };
        this.minSize = options.minSize || 5; // Minimum size of the circle
        this.roughGenerator = rough.generator(this.roughOptions);
        this._updateRoughCircle();
    }

    _updateRoughCircle() {

        let [x1, y1, x2, y2] = this.points;
        let width = Math.abs(x2 - x1);
        let height = Math.abs(y2 - y1);

        // Ensure minimum size
        if (width < this.minSize) {
            width = this.minSize;
            x2 = x1 + (x2 > x1 ? width : -width);
        }
        if (height < this.minSize) {
            height = this.minSize;
            y2 = y1 + (y2 > y1 ? height : -height);
        }

        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);

        // Use the larger dimension for the circle diameter
        const diameter = Math.max(width, height);

        this.set({
            left: left + width / 2,
            top: top + height / 2,
            width: diameter,
            height: diameter
        });

        this.roughCircle = this.roughGenerator.circle(diameter / 2, diameter / 2, diameter, this.roughOptions);
        this.setCoords();
    }

    _render(ctx) {
        ctx.save();
        ctx.translate(-this.width / 2, -this.height / 2);

        const roughCanvas = rough.canvas(ctx.canvas)
        roughCanvas.draw(this.roughCircle);

        ctx.restore();
    }

    setPoints(points) {
        this.points = points;
        this._updateRoughCircle();
    }

    updateRoughOptions(newOptions) {
        this.roughOptions = { ...this.roughOptions, ...newOptions };
        this._updateRoughCircle();
        this.dirty = true;
        this.canvas && this.canvas.requestRenderAll();
    }

    toObject(propertiesToInclude) {
        return {
            ...super.toObject(propertiesToInclude),
            points: this.points,
            roughOptions: this.roughOptions,
            minSize: this.minSize
        };
    }

    static fromObject(object, callback) {
        return new FabricRoughCircle(object.points, object, callback);
    }
}
