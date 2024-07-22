import * as fabric from 'fabric';
import rough from 'roughjs';

export class FabricRoughLine extends fabric.FabricObject {
    static type = 'FabricRoughLine';

    constructor(points, options = {}) {
        super(options);
        this.points = points || [0, 0, 100, 100];
        this.roughOptions = {
            stroke: options.stroke || 'black',
            roughness: options.roughness || 1,
            ...options.roughOptions
        };
        this.roughGenerator = rough.generator();
        this._updateRoughLine();
    }

    _updateRoughLine() {
        const [x1, y1, x2, y2] = this.points;
        this.roughLine = this.roughGenerator.line(x1, y1, x2, y2, this.roughOptions);
        this._updateBoundingBox();
    }

    _updateBoundingBox() {
        const bbox = this._calculateBoundingBox();
        this.set({
            left: bbox.x,
            top: bbox.y,
            width: bbox.width,
            height: bbox.height
        });
        this.setCoords();
    }

    _calculateBoundingBox() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        this.roughLine.sets.forEach(set => {
            set.ops.forEach(op => {
                const points = op.data;
                for (let i = 0; i < points.length; i += 2) {
                    const [x, y] = [points[i], points[i + 1]];
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            });
        });
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    _render(ctx) {
        ctx.save();

        // Apply object's transformations
        ctx.translate(-this.width / 2, -this.height / 2);

        // Draw the rough line
        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughLine);

        ctx.restore();
    }

    setPoints(points) {
        this.points = points;
        this._updateRoughLine();
    }

    toObject(propertiesToInclude) {
        return fabric.util.object.extend(super.toObject(propertiesToInclude), {
            points: this.points,
            roughOptions: this.roughOptions
        });
    }

    static fromObject(object, callback) {
        return new FabricRoughLine(object.points, object).then(callback);
    }
}
