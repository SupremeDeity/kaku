import * as fabric from 'fabric';
import rough from 'roughjs';

export class FabricRoughLine extends fabric.FabricObject {
    static get type() {
        return 'FabricRoughLine';
    }
    constructor(options = {}) {
        super(options);
        this.name = "Line";
        this.points = options.points;
        this.roughOptions.seed = this.roughOptions.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator();
        this._updateRoughLine();
    }

    _updateRoughLine() {
        const [x1, y1, x2, y2] = this.points;
        this.roughLine = this.roughGenerator.line(0, 0, x2 - x1, y2 - y1, this.roughOptions);
        this._updateDimensions();
    }

    _updateDimensions() {
        const [x1, y1, x2, y2] = this.points;
        const width = x2 - x1;
        const height = y2 - y1;

        this.set({
            left: x1,
            top: y1,
            width: width,
            height: Math.abs(height),
        });
        this.scaleY = height < 0 ? -1 : 1;
        this.setCoords();
    }


    _render(ctx) {
        ctx.save();

        // Translate to the object's position
        ctx.translate(-this.width / 2, -this.height / 2);

        // Apply scaling
        ctx.scale(this.scaleX, this.scaleY);

        // Draw the rough line
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
