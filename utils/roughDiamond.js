import * as fabric from 'fabric';
import rough from 'roughjs';

export class FabricRoughDiamond extends fabric.FabricObject {
    static get type() {
        return 'FabricRoughDiamond';
    }
    constructor(options = {}) {
        super(options);
        this.name = "Diamond";
        this.points = options.points || [0, 0, 100, 100];
        this.minSize = options.minSize || 5;
        this.roughOptions.seed = this.roughOptions.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator();
        this.left = this.left !== 0 ? this.left : options.points[0];
        this.top = this.top !== 0 ? this.top : options.points[1];
        this._updateRoughDiamond();
    }

    _updateRoughDiamond() {
        const [x1, y1, x2, y2] = this.points;
        const widthOffset = this.left === x1 ? 0 : this.left - x1;
        const heightOffset = this.top === y1 ? 0 : this.top - y1;
        let width = x2 - this.left + widthOffset;
        let height = y2 - this.top + heightOffset;
        // Gets the top and left based on set origin
        const relativeCenter = this.getRelativeCenterPoint()
        // Translates the relativeCenter point as if origin = 0,0
        const constraint = this.translateToOriginPoint(relativeCenter, 'left', 'top')
        this.set({
            width: width,
            height: height
        });
        // Put shape back in place
        this.setPositionByOrigin(
            constraint,
            'left',
            'top',
        );

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

    // TODO: REMOVE THIS WHEN Group rework
    updateRoughOptions(newOptions) {
        this.roughOptions = { ...this.roughOptions, ...newOptions };
        this._updateRoughDiamond();
        this.dirty = true;
        this.canvas && this.canvas.requestRenderAll();
    }

    update() {
        this._updateRoughDiamond();
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

fabric.classRegistry.setClass(FabricRoughDiamond);
fabric.classRegistry.setSVGClass(FabricRoughDiamond);