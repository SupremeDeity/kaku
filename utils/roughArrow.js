import * as fabric from "fabric";
import rough from "roughjs";
import { ArrowHeadStyle } from "./constants";
import { getLineAngle } from "./roughutil";

export class FabricRoughArrow extends fabric.Path {
    static get type() {
        return "FabricRoughArrow";
    }
    constructor(path, options = {}) {
        super(path, options);
        this.name = "Arrow";
        this.points = options.points;
        this.roughOptions = options.roughOptions;
        this.roughOptions.seed = this.roughOptions?.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator();
        this.left = this.left !== 0 ? this.left : options.points[0];
        this.top = this.top !== 0 ? this.top : options.points[1];
        this.startArrowHeadStyle =
            options.startArrowHeadStyle || ArrowHeadStyle.NoHead;
        this.endArrowHeadStyle = options.endArrowHeadStyle || ArrowHeadStyle.Head;
        this._updateRoughArrow();
        this.controls = fabric.controlsUtils.createPathControls(this, {
            controlPointStyle: {
                controlStroke: "slateblue",
                controlFill: "slateblue",
            },
            pointStyle: {
                controlStroke: "slateblue",
                controlFill: "slateblue",
            },
        });
        this.on("modifyPath", () => {
            this.editing = true;
            this._updateRoughArrow();
            this.editing = false;
        });
    }

    _createPathData(points) {
        const [x1, y1, x2, y2] = points;
        return `M ${x1} ${y1} Q 0 0 ${x2} ${y2}`;
    }

    _updateRoughArrow() {
        if (this.isDrawing) {
            const [x1, y1, x2, y2] = this.points;
            const points = [
                { x: x1, y: y1 },
                { x: x2, y: y2 },
            ];

            const bounds = fabric.util.makeBoundingBoxFromPoints(points);

            const widthSign = x2 >= x1 ? 1 : -1;
            const heightSign = y2 >= y1 ? 1 : -1;

            const originX = widthSign < 0 ? "right" : "left";
            const originY = heightSign < 0 ? "bottom" : "top";
            const relativeCenter = this.getRelativeCenterPoint();
            const constraint = this.translateToOriginPoint(
                relativeCenter,
                originX,
                originY
            );
            this.set({
                width: Math.abs(bounds.width),
                height: Math.abs(bounds.height),
            });
            this.setPositionByOrigin(constraint, originX, originY);

            const pathData = this._createPathData([
                (-bounds.width / 2) * widthSign,
                (-bounds.height / 2) * heightSign,
                (bounds.width / 2) * widthSign,
                (bounds.height / 2) * heightSign,
            ]);

            this.path = fabric.util.parsePath(pathData);
        } else {
            const scaledPath = [
                [
                    this.path[0][0],
                    this.path[0][1] - this.pathOffset.x,
                    this.path[0][2] - this.pathOffset.y,
                ],
                [
                    this.path[1][0],
                    this.path[1][1] - this.pathOffset.x,
                    this.path[1][2] - this.pathOffset.y,
                    this.path[1][3] - this.pathOffset.x,
                    this.path[1][4] - this.pathOffset.y,
                ],
            ];
            this.roughArrow = this.roughGenerator.path(
                fabric.util.joinPath(scaledPath),
                this.roughOptions
            );
            this.setCoords();

            // Use path[0] for start point and path[1] for end point
            const [, x1, y1] = this.path[0];
            const [, x, y, x2, y2] = this.path[1];
            const angleStart = getLineAngle(x - x1, y - y1);
            const angleEnd = getLineAngle(x2 - x, y2 - y);
            this._updateArrowHeads(
                x1 - this.pathOffset.x,
                y1 - this.pathOffset.y,
                x2 - this.pathOffset.x,
                y2 - this.pathOffset.y,
                angleStart,
                angleEnd
            );
            return;
        }

        this.roughArrow = this.roughGenerator.path(
            fabric.util.joinPath(this.path),
            this.roughOptions
        );

        const [, x1, y1, x2, y2] = this.path[1];
        const angleStart = getLineAngle(x1 - this.pathOffset.x, y1 - this.pathOffset.y);
        const angleEnd = getLineAngle(x2 - this.pathOffset.x, y2 - this.pathOffset.y);

        this._updateArrowHeads(x1, y1, x2, y2, angleStart, angleEnd);
    }

    _updateArrowHeads(x1, y1, x2, y2, angleStart, angleEnd) {
        if (this.endArrowHeadStyle !== ArrowHeadStyle.NoHead) {
            const isFilled = this.endArrowHeadStyle === ArrowHeadStyle.FilledHead;
            const headPath = this._calculateHeadPath(x2, y2, angleEnd);
            this.endArrowHead = this.roughGenerator.path(
                headPath + (isFilled ? "Z" : ""),
                {
                    ...this.roughOptions,
                    fill: isFilled ? this.roughOptions.stroke : "transparent",
                }
            );
        }

        if (this.startArrowHeadStyle !== ArrowHeadStyle.NoHead) {
            const isFilled = this.startArrowHeadStyle === ArrowHeadStyle.FilledHead;
            const headPath = this._calculateHeadPath(x1, y1, angleStart + Math.PI);
            this.startArrowHead = this.roughGenerator.path(
                headPath + (isFilled ? "Z" : ""),
                {
                    ...this.roughOptions,
                    fill: isFilled ? this.roughOptions.stroke : "transparent",
                }
            );
        }
    }

    _calculateHeadPath(x, y, angle, headlen = 30) {
        const x1 = x - headlen * Math.cos(angle - Math.PI / 6);
        const y1 = y - headlen * Math.sin(angle - Math.PI / 6);
        const x2 = x - headlen * Math.cos(angle + Math.PI / 6);
        const y2 = y - headlen * Math.sin(angle + Math.PI / 6);

        return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(
            2
        )} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    }

    _render(ctx) {
        ctx.save();
        const roughCanvas = rough.canvas(ctx.canvas);
        roughCanvas.draw(this.roughArrow);
        if (this.endArrowHeadStyle !== ArrowHeadStyle.NoHead)
            roughCanvas.draw(this.endArrowHead);
        if (this.startArrowHeadStyle !== ArrowHeadStyle.NoHead)
            roughCanvas.draw(this.startArrowHead);
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
            editing: this.editing,
            path: this.path,
            points: this.points,
            roughOptions: this.roughOptions,
            startArrowHeadStyle: this.startArrowHeadStyle,
            endArrowHeadStyle: this.endArrowHeadStyle,
        };
    }
}

fabric.classRegistry.setClass(FabricRoughArrow);
fabric.classRegistry.setSVGClass(FabricRoughArrow);
