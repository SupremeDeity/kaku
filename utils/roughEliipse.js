import * as fabric from "fabric";
import rough from "roughjs";

export class FabricRoughEllipse extends fabric.Ellipse {
    static type = "Ellipse";

    constructor(points, options = {}) {
        super(options);
        // this.points = [100, 100, 200, 300];
        this.points = points;
        this.minSize = options.minSize || 5;
        this.roughGenerator = rough.generator(this.roughOptions);
        this._updateRoughEllipse();
    }

    _updateRoughEllipse() {
        let [x1, y1, x2, y2] = this.points;

        let w = this.roughOptions.size?.width ?? Math.abs(x2 - x1);
        let h = this.roughOptions.size?.height ?? Math.abs(y2 - y1);
        this.set({
            left: this.roughOptions.size ? -w / 2 : x1,
            top: this.roughOptions.size ? -h / 2 : y1,
            width: w,
            height: h,
        });

        this.roughEllipse = this.roughGenerator.ellipse(
            w / 2,
            h / 2,
            w,
            h,
            this.roughOptions
        );
        this.setCoords();
    }

    _render(ctx) {
        ctx.save();
        ctx.translate(-this.width / 2, -this.height / 2);

        const roughCanvas = rough.canvas(ctx.canvas);
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
            minSize: this.minSize,
        };
    }

    static fromObject(object, callback) {
        return new FabricRoughEllipse(object.points, object, callback);
    }
}
