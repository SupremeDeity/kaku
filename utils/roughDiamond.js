import * as fabric from 'fabric';
import rough from 'roughjs';
import { calculateCornerRadius } from './roughutil';

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

        const originX = Math.sign(width) < 0 ? 'right' : 'left';
        const originY = Math.sign(height) < 0 ? 'bottom' : 'top';
        width = Math.abs(width)
        height = Math.abs(height)

        const relativeCenter = this.getRelativeCenterPoint();
        const constraint = this.translateToOriginPoint(relativeCenter, originX, originY);

        this.set({ width: width, height: height });
        this.setPositionByOrigin(constraint, originX, originY);

        this.roughOptions.preserveVertices = this.rounded;
        if (this.rounded) {
            const topX = width / 2, topY = 0;
            const rightX = width, rightY = height / 2;
            const bottomX = width / 2, bottomY = height;
            const leftX = 0, leftY = height / 2;

            const verticalRadius = calculateCornerRadius(Math.abs(topX - leftX));
            const horizontalRadius = calculateCornerRadius(Math.abs(rightY - topY));

            const path = `
          M ${topX + verticalRadius} ${topY + horizontalRadius} 
          L ${rightX - verticalRadius} ${rightY - horizontalRadius}
          C ${rightX} ${rightY}, ${rightX} ${rightY}, ${rightX - verticalRadius} ${rightY + horizontalRadius}
          L ${bottomX + verticalRadius} ${bottomY - horizontalRadius}
          C ${bottomX} ${bottomY}, ${bottomX} ${bottomY}, ${bottomX - verticalRadius} ${bottomY - horizontalRadius}
          L ${leftX + verticalRadius} ${leftY + horizontalRadius}
          C ${leftX} ${leftY}, ${leftX} ${leftY}, ${leftX + verticalRadius} ${leftY - horizontalRadius}
          L ${topX - verticalRadius} ${topY + horizontalRadius}
          C ${topX} ${topY}, ${topX} ${topY}, ${topX + verticalRadius} ${topY + horizontalRadius}
        `;
            this.roughDiamond = this.roughGenerator.path(path, this.roughOptions);
        } else {
            const diamondPoints = [
                [width / 2, 0],
                [width, height / 2],
                [width / 2, height],
                [0, height / 2]
            ];

            this.roughDiamond = this.roughGenerator.polygon(diamondPoints, this.roughOptions);
        }

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
            minSize: this.minSize,
            rounded: this.rounded
        };
    }
}

fabric.classRegistry.setClass(FabricRoughDiamond);
fabric.classRegistry.setSVGClass(FabricRoughDiamond);