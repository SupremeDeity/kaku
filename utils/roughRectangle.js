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
        this.left = this.left !== 0 ? this.left : options.points[0];
        this.top = this.top !== 0 ? this.top : options.points[1];
        this._updateRoughRectangle();
    }

    _updateRoughRectangle() {
        const [x1, y1, x2, y2] = this.points;

        const widthOffset = this.left === x1 ? 0 : this.left - x1;
        const heightOffset = this.top === y1 ? 0 : this.top - y1;
        let width = x2 - this.left + widthOffset;
        let height = y2 - this.top + heightOffset;

        // Gets the top and left based on set origin
        const relativeCenter = this.getRelativeCenterPoint()
        // Translates the relativeCenter point as if origin = 0,0
        const constraint = this.translateToOriginPoint(relativeCenter, 'left', 'top')

        // Shape changing stuff
        this.set({
            width: width,
            height: height,
        });

        this.roughRectangle = this.roughGenerator.rectangle(
            - this.width / 2,
            - this.height / 2,
            width,
            height,
            this.roughOptions
        );


        // Put shape back in place
        this.setPositionByOrigin(
            constraint,
            'left',
            'top',
        );

        this.setCoords();
    }


    _render(ctx) {
        ctx.save();

        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughRectangle);

        ctx.restore();
    }

    setPoints(points) {
        this.set({ points: points, dirty: true })
        this._updateRoughRectangle(true);
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