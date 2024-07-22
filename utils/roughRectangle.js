import * as fabric from 'fabric';
import rough from 'roughjs';

export class FabricRoughRectangle extends fabric.FabricObject {
    static type = 'FabricRoughRectangle';

    constructor(points, options = {}) {
        super(options);
        this.points = points || [0, 0, 100, 100];
        this.roughOptions = {
            stroke: options.stroke || 'black',
            fill: options.fill || 'transparent',
            roughness: options.roughness || 1,
            ...options.roughOptions
        };
        this.minSize = options.minSize || 5; // Minimum size of the circle
        this.roughGenerator = rough.generator();
        this._updateRoughRectangle();
    }

    _updateRoughRectangle() {
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
            left: left + width,
            top: top + height,
            width: diameter,
            height: diameter
        });

        this.roughRectangle = this.roughGenerator.rectangle(diameter, diameter, diameter, this.roughOptions);
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
        this.points = points;
        this._updateRoughRectangle();
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
        return new FabricRoughRectangle(object.points, object, callback);
    }
}