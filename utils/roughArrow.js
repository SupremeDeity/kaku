import * as fabric from "fabric";
import rough from "roughjs";

export class FabricRoughArrow extends fabric.FabricObject {
    static get type() {
        return "FabricRoughArrow";
    }
    constructor(options = {}) {
        super(options);
        this.name = "Arrow";
        this.points = options.points;
        this.roughOptions.seed = this.roughOptions.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator();
        this.left = this.left !== 0 ? this.left : options.points[0];
        this.top = this.top !== 0 ? this.top : options.points[1];
        this._updateRoughArrow();
    }

    _updateRoughArrow() {
        const [x1, y1, x2, y2] = this.points;
        const widthOffset = this.left === x1 ? 0 : this.left - x1;
        const heightOffset = this.top === y1 ? 0 : this.top - y1;
        let width = x2 - this.left + widthOffset;
        let height = y2 - this.top + heightOffset;

        const originX = Math.sign(width) < 0 ? "right" : "left";
        const originY = Math.sign(height) < 0 ? "bottom" : "top";

        // Gets the top and left based on set origin
        const relativeCenter = this.getRelativeCenterPoint();
        // Translates the relativeCenter point as if origin = 0,0
        const constraint = this.translateToOriginPoint(
            relativeCenter,
            originX,
            originY
        );
        this.set({
            width: Math.abs(width),
            height: Math.abs(height),
        });
        // Put shape back in place
        this.setPositionByOrigin(constraint, originX, originY);
        this.setCoords();
        this.roughArrow = this.roughGenerator.line(
            -width / 2,
            -height / 2,
            width / 2,
            height / 2,
            this.roughOptions
        );
        const angle = this._getAngle(width, height);
        const headPath = this._calculateHeadPath(width / 2, height / 2, angle);
        // const headPath2 = this._calculateHeadPath(-(width) / 2, -height / 2, angle + Math.PI);
        this.roughArrowhead = this.roughGenerator.path(
            headPath,
            this.roughOptions
        );
        // this.roughArrowhead2 = this.roughGenerator.path(
        //     headPath2,
        //     this.roughOptions
        // );
    }

    _getAngle(width, height) {
        return Math.atan2(height / 2 - (-height / 2), width / 2 - (-width / 2));
    }

    _calculateHeadPath(x, y, angle, headlen = 30) {
        const x1 = x - headlen * Math.cos(angle - Math.PI / 6);
        const y1 = y - headlen * Math.sin(angle - Math.PI / 6);
        const x2 = x - headlen * Math.cos(angle + Math.PI / 6);
        const y2 = y - headlen * Math.sin(angle + Math.PI / 6);

        return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    }

    _render(ctx) {
        ctx.save();
        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughArrow);
        roughCanvas.draw(this.roughArrowhead);
        // roughCanvas.draw(this.roughArrowhead2);
        ctx.restore();
    }

    setPoints(points) {
        this.points = points;
        this._updateRoughArrow();
    }

    update() {
        this._updateRoughArrow();
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
fabric.classRegistry.setClass(FabricRoughArrow);
fabric.classRegistry.setSVGClass(FabricRoughArrow);
