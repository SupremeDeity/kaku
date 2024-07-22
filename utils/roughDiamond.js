import * as fabric from 'fabric';
import rough from 'roughjs';

export class FabricRoughDiamond extends fabric.FabricObject {
    static type = 'FabricRoughDiamond';

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
        this.minSize = options.minSize || 5; // Minimum size of the diamond
        this.roughGenerator = rough.generator();
        this._updateRoughDiamond();
    }

    _updateRoughDiamond() {
        const [x1, y1, x2, y2] = this.points;
        let width = Math.abs(x2 - x1);
        let height = Math.abs(y2 - y1);

        // Ensure minimum size
        width = Math.max(width, this.minSize);
        height = Math.max(height, this.minSize);

        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);

        this.set({
            left: left + width / 2,
            top: top + height / 2,
            width: width,
            height: height
        });

        // Create diamond points
        const diamondPoints = [
            [width / 2, 0],
            [width, height / 2],
            [width / 2, height],
            [0, height / 2]
        ];

        this.roughDiamond = this.roughGenerator.polygon(diamondPoints, this.roughOptions);
        this.setCoords();
    }

    _render(ctx) {
        ctx.save();
        ctx.translate(-this.width / 2, -this.height / 2);

        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughDiamond);

        ctx.restore();
    }

    setPoints(points) {
        this.points = points;
        this._updateRoughDiamond();
    }

    updateRoughOptions(newOptions) {
        this.roughOptions = { ...this.roughOptions, ...newOptions };
        this._updateRoughDiamond();
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
        return new FabricRoughDiamond(object.points, object, callback);
    }
}