import * as fabric from 'fabric';
import rough from 'roughjs';

export class FabricRoughEllipse extends fabric.Ellipse {
    static type = 'FabricRoughEllipse';

    constructor(points, options = {}) {
        super(options);
        this.points = [100, 100, 200, 300];
        // this.points = points;
        this.minSize = options.minSize || 5;
        this.roughGenerator = rough.generator(this.roughOptions);
        this._updateRoughEllipse();
    }

    _updateRoughEllipse() {
        let [x1, y1, x2, y2] = this.points;
        let width = Math.abs(x2 - x1);
        let height = Math.abs(y2 - y1);
        this.set({
            left: x1,
            top: y1,
            width: width,
            height: height
        });


        this.roughEllipse = this.roughGenerator.ellipse(Math.abs(width / 2), Math.abs(height / 2), width, height, this.roughOptions);
        console.log(this.roughEllipse)
        this.setCoords();
    }

    _render(ctx) {
        ctx.save();
        ctx.translate(-this.width / 2, -this.height / 2);

        const roughCanvas = rough.canvas(ctx.canvas)
        roughCanvas.draw(this.roughEllipse);

        ctx.restore();
    }

    setPoints(points) {
        this.points = points;
        this._updateRoughEllipse();
    }

    updateRoughOptions(newOptions) {
        this.roughOptions = { ...this.roughOptions, ...newOptions };
        this._updateRoughEllipse();
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
        return new FabricRoughEllipse(object.points, object, callback);
    }
}
