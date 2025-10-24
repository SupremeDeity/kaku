import * as fabric from "fabric";
import rough from "roughjs";
import { ArrowHeadStyle } from "../utils/constants";
import { getLineAngle, generateUniqueId, isPointNearBoundingBox, movePathPoint } from "../utils/roughutil";

export class FabricRoughArrow extends fabric.Path {
    static get type() {
        return "FabricRoughArrow";
    }
    constructor(path, options = {}) {
        super(path, options);
        this.name = "Arrow";
        this.points = options.points;
        this.roughOptions = this.roughOptions ?? options.roughOptions;
        this.objectCaching = false;

        this.id = options.id || generateUniqueId();

        this.roughOptions.seed = this.roughOptions?.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator(this.roughOptions);
        this.left =
            this.left !== null && this.left !== 0 ? this.left : options.points[0];
        this.top =
            this.top !== null && this.top !== 0 ? this.top : options.points[1];
        this.startArrowHeadStyle =
            options.startArrowHeadStyle || ArrowHeadStyle.NoHead;
        this.endArrowHeadStyle = options.endArrowHeadStyle || ArrowHeadStyle.Arrow;

        // Initialize bindings if they exist in options
        if (options.startBinding) {
            this.startBinding = { ...options.startBinding };
        }
        if (options.endBinding) {
            this.endBinding = { ...options.endBinding };
        }

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

        this.on("added", () => {
            this.reconnectBindings();
        });

        this.on("modified", () => {
            if (this.path.length < 2) return;

            const matrix = this.calcTransformMatrix();
            const startLocal = new fabric.Point(this.path[0][1] - this.pathOffset.x, this.path[0][2] - this.pathOffset.y);
            const startScene = startLocal.transform(matrix);

            const endLocal = new fabric.Point(this.path[1][3] - this.pathOffset.x, this.path[1][4] - this.pathOffset.y);
            const endScene = endLocal.transform(matrix);

            // Now call _checkPotentialBindings with scene-space coordinates
            this._checkPotentialBindings(startScene.x, startScene.y, endScene.x, endScene.y);
            this.finalizePotentialBindings();
        })
    }
    _getBindingConfig(bindingType) {
        return bindingType === 'end'
            ? { pathIndex1: 1, pathIndex2: 3 }
            : { pathIndex1: 0, pathIndex2: 1 };
    }

    _createMovingHandler(binding, pathIndex1, pathIndex2) {
        return () => {
            const newScenePoint = (binding.object.getCenterPoint()).add({ x: binding.offsetX, y: binding.offsetY });

            movePathPoint(this, newScenePoint.x, newScenePoint.y, pathIndex1, pathIndex2);
            this.setCoords();
            this.update();
        };
    }

    _attachBindingListener(binding, bindingType) {
        const config = this._getBindingConfig(bindingType);
        const handler = this._createMovingHandler(binding, config.pathIndex1, config.pathIndex2);
        const dispose = binding.object.on("moving", handler);
        binding.dispose = dispose;
        return dispose;
    }

    _createBinding(obj, x, y, bindingType) {
        const connectionPoint = new fabric.Point(x, y);
        const objectCenter = obj.getCenterPoint();
        const offset = connectionPoint.subtract(objectCenter);

        const binding = {
            elementId: obj.id,
            offsetX: offset.x,
            offsetY: offset.y,
            object: obj,
        };

        // Clean up existing binding if any
        this._cleanupBinding(bindingType);

        // Attach event listener
        this._attachBindingListener(binding, bindingType);

        // Store the binding
        if (bindingType === "end") {
            this.endBinding = binding;
        } else {
            this.startBinding = binding;
        }
    }

    _cleanupBinding(bindingType) {
        const binding = bindingType === 'end' ? this.endBinding : this.startBinding;
        if (binding?.dispose) {
            binding.dispose();
        }
    }

    _createPathData(points) {
        const [x1, y1, x2, y2] = points;
        return `M ${x1} ${y1} Q 0 0 ${x2} ${y2}`;
    }

    _checkPotentialBindings(x1, y1, x2, y2) {
        const objects = this.canvas.getObjects();

        // Clear existing highlights first
        this._clearPotentialHighlights();

        // Track potential bindings during drawing (don't create actual bindings yet)
        let potentialEndBinding = null;
        let potentialStartBinding = null;
        let closestEndDistance = Infinity;
        let closestStartDistance = Infinity;

        for (const obj of objects) {
            if (obj.type === this.type) continue;

            const endPoint = new fabric.Point(x2, y2);
            const startPoint = new fabric.Point(x1, y1);

            // Check for potential end binding
            if (isPointNearBoundingBox(endPoint, obj, 20)) {
                const objCenter = obj.getCenterPoint();
                const endDistance = endPoint.distanceFrom(objCenter);

                if (endDistance < closestEndDistance) {
                    closestEndDistance = endDistance;
                    potentialEndBinding = { obj, x: x2, y: y2 };
                }
            }

            // Check for potential start binding
            if (isPointNearBoundingBox(startPoint, obj, 20)) {
                const objCenter = obj.getCenterPoint();
                const startDistance = startPoint.distanceFrom(objCenter);

                if (startDistance < closestStartDistance) {
                    closestStartDistance = startDistance;
                    potentialStartBinding = { obj, x: x1, y: y1 };
                }
            }
        }

        // Highlight only the closest objects
        if (potentialEndBinding) {
            this._highlightObject(potentialEndBinding.obj);
        }
        if (potentialStartBinding && potentialStartBinding.obj !== potentialEndBinding?.obj) {
            this._highlightObject(potentialStartBinding.obj);
        }

        // Store potential bindings for finalization later
        this._potentialEndBinding = potentialEndBinding;
        this._potentialStartBinding = potentialStartBinding;
    }

    _highlightObject(obj) {
        // Store original properties if not already stored
        if (!obj._originalHighlightProps) {
            obj._originalHighlightProps = {
                shadow: obj.shadow
            };
        }
        // Apply highlight effect
        obj.set({
            shadow: new fabric.Shadow({
                color: "#ffff",
                blur: 15,
                offsetX: 0,
                offsetY: 0
            })
        });

        // Track highlighted objects
        if (!this._highlightedObjects) {
            this._highlightedObjects = new Set();
        }
        this._highlightedObjects.add(obj);

        this.canvas.requestRenderAll();
    }

    _clearPotentialHighlights() {
        if (!this._highlightedObjects) return;

        this._highlightedObjects.forEach(obj => {
            if (obj._originalHighlightProps) {
                obj.set({
                    shadow: obj._originalHighlightProps.shadow
                });
                delete obj._originalHighlightProps;
            }
        });

        this._highlightedObjects.clear();
        this.canvas.requestRenderAll();
    }

    _getArrowheadCutoffDistance(style) {
        // Returns the distance to shorten the shaft for different arrowhead styles
        const headlen = 30; // Same as used in _calculateHeadPath
        const offset = 15; // Same as used in _calculateHeadPath

        switch (style) {
            case ArrowHeadStyle.Triangle:
            case ArrowHeadStyle.FilledTriangle:
                return offset; // Cut at the base of the triangle

            case ArrowHeadStyle.Circle:
            case ArrowHeadStyle.FilledCircle:
                const radius = headlen / 4.5;
                return offset - radius; // Cut at the back edge of the circle

            case ArrowHeadStyle.Diamond:
            case ArrowHeadStyle.FilledDiamond:
                const diamondLen = headlen * 0.8;
                return offset - diamondLen; // Cut at the back point of the diamond

            default:
                return 0; // No cutoff for other arrow head styles
        }
    }

    _updateRoughArrow() {
        if (this.canvas && this.isDrawing) {
            this._checkPotentialBindings(...this.points);
        }

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

            // Calculate cutoff distances for arrowheads
            const startCutoff = this._getArrowheadCutoffDistance(this.startArrowHeadStyle);
            const endCutoff = this._getArrowheadCutoffDistance(this.endArrowHeadStyle);

            // Calculate the angle and length of the arrow
            const dx = bounds.width * widthSign;
            const dy = bounds.height * heightSign;
            const length = Math.sqrt(dx * dx + dy * dy);

            // Calculate shortened endpoints
            let startX = (-bounds.width / 2) * widthSign;
            let startY = (-bounds.height / 2) * heightSign;
            let endX = (bounds.width / 2) * widthSign;
            let endY = (bounds.height / 2) * heightSign;

            if (length > 0) {
                // Shorten from start
                if (startCutoff > 0) {
                    const ratio = startCutoff / length;
                    startX += dx * ratio;
                    startY += dy * ratio;
                }

                // Shorten from end
                if (endCutoff > 0) {
                    const ratio = endCutoff / length;
                    endX -= dx * ratio;
                    endY -= dy * ratio;
                }
            }

            const pathData = this._createPathData([startX, startY, endX, endY]);

            this.path = fabric.util.parsePath(pathData);
            this.roughArrow = this.roughGenerator.path(
                fabric.util.joinPath(this.path),
                this.roughOptions
            );

            const [, _x1, _y1, _x2, _y2] = this.path[1];
            const angleStart = getLineAngle(_x1, _y1);
            const angleEnd = getLineAngle(_x2, _y2);

            // Pass original endpoints for arrowhead positioning
            this._updateArrowHeads(
                (-bounds.width / 2) * widthSign,
                (-bounds.height / 2) * heightSign,
                (bounds.width / 2) * widthSign,
                (bounds.height / 2) * heightSign,
                angleStart,
                angleEnd
            );
        } else {
            // Calculate cutoff distances for arrowheads
            const startCutoff = this._getArrowheadCutoffDistance(this.startArrowHeadStyle);
            const endCutoff = this._getArrowheadCutoffDistance(this.endArrowHeadStyle);

            // Get original path points
            const [, x1, y1] = this.path[0];
            const [, x, y, x2, y2] = this.path[1];

            // Calculate the full vector
            const dx1 = x - x1;
            const dy1 = y - y1;
            const dx2 = x2 - x;
            const dy2 = y2 - y;
            const length1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
            const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            // Calculate shortened endpoints for the shaft
            let shaftX1 = x1;
            let shaftY1 = y1;
            let shaftX2 = x2;
            let shaftY2 = y2;

            if (length1 > 0 && startCutoff > 0) {
                const ratio = startCutoff / length1;
                shaftX1 += dx1 * ratio;
                shaftY1 += dy1 * ratio;
            }

            if (length2 > 0 && endCutoff > 0) {
                const ratio = endCutoff / length2;
                shaftX2 -= dx2 * ratio;
                shaftY2 -= dy2 * ratio;
            }

            const scaledPath = [
                [
                    this.path[0][0],
                    shaftX1 - this.pathOffset.x,
                    shaftY1 - this.pathOffset.y,
                ],
                [
                    this.path[1][0],
                    this.path[1][1] - this.pathOffset.x,
                    this.path[1][2] - this.pathOffset.y,
                    shaftX2 - this.pathOffset.x,
                    shaftY2 - this.pathOffset.y,
                ],
            ];
            this.roughArrow = this.roughGenerator.path(
                fabric.util.joinPath(scaledPath),
                this.roughOptions
            );

            // Use original path points for arrowhead positioning and angles
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
        }
    }


    _generateHeadPath(x, y, angle, style) {
        const isFilled = [ArrowHeadStyle.FilledTriangle, ArrowHeadStyle.FilledDiamond, ArrowHeadStyle.FilledCircle].includes(style);
        const headPath = this._calculateHeadPath(x, y, angle, 30, style);
        return this.roughGenerator.path(
            headPath + (isFilled ? "Z" : ""),
            {
                ...this.roughOptions,
                fill: isFilled ? this.roughOptions.stroke : "transparent",
            }
        );
    }

    _updateArrowHeads(x1, y1, x2, y2, angleStart, angleEnd) {
        if (this.endArrowHeadStyle !== ArrowHeadStyle.NoHead) {
            this.endArrowHead = this._generateHeadPath(x2, y2, angleEnd, this.endArrowHeadStyle);
        }

        if (this.startArrowHeadStyle !== ArrowHeadStyle.NoHead) {
            this.startArrowHead = this._generateHeadPath(x1, y1, angleStart + Math.PI, this.startArrowHeadStyle);

        }
    }

    _calculateHeadPath(x, y, angle, headlen = 30, style) {
        const x1 = x - headlen * Math.cos(angle - Math.PI / 6);
        const y1 = y - headlen * Math.sin(angle - Math.PI / 6);
        const x2 = x - headlen * Math.cos(angle + Math.PI / 6);
        const y2 = y - headlen * Math.sin(angle + Math.PI / 6);

        // Default arrow path (V-shape, open at the back)
        let path = `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
        // Handle different arrow head styles
        switch (style) {
            case ArrowHeadStyle.Arrow:
                // Arrow is the default V-shape, already set above
                break;

            case ArrowHeadStyle.Triangle:
            case ArrowHeadStyle.FilledTriangle:
                // Triangle has the closing line at the back (smaller for ERD)
                const triX1 = x - (headlen * 0.5) * Math.cos(angle - Math.PI / 7);
                const triY1 = y - (headlen * 0.5) * Math.sin(angle - Math.PI / 7);
                const triX2 = x - (headlen * 0.5) * Math.cos(angle + Math.PI / 7);
                const triY2 = y - (headlen * 0.5) * Math.sin(angle + Math.PI / 7);
                path = `M ${triX1.toFixed(2)} ${triY1.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)} L ${triX2.toFixed(2)} ${triY2.toFixed(2)} L ${triX1.toFixed(2)} ${triY1.toFixed(2)}`;
                break;

            case ArrowHeadStyle.Bar:
                // Perpendicular line at the arrow tip
                const barX1 = x - (headlen / 2) * Math.cos(angle - Math.PI / 2);
                const barY1 = y - (headlen / 2) * Math.sin(angle - Math.PI / 2);
                const barX2 = x - (headlen / 2) * Math.cos(angle + Math.PI / 2);
                const barY2 = y - (headlen / 2) * Math.sin(angle + Math.PI / 2);
                path = `M ${barX1.toFixed(2)} ${barY1.toFixed(2)} L ${barX2.toFixed(2)} ${barY2.toFixed(2)}`;
                break;

            case ArrowHeadStyle.Circle:
            case ArrowHeadStyle.FilledCircle:
                // Circle at the arrow tip (smaller for ERD)
                const radius = headlen / 4.5;
                const circleX = x - radius * Math.cos(angle);
                const circleY = y - radius * Math.sin(angle);
                path = `M ${(circleX + radius).toFixed(2)} ${circleY.toFixed(2)} ` +
                    `A ${radius} ${radius} 0 1 1 ${(circleX - radius).toFixed(2)} ${circleY.toFixed(2)} ` +
                    `A ${radius} ${radius} 0 1 1 ${(circleX + radius).toFixed(2)} ${circleY.toFixed(2)}`;
                break;

            case ArrowHeadStyle.Diamond:
            case ArrowHeadStyle.FilledDiamond:
                const diamondLen = headlen * 0.8;
                const diamondWidth = headlen / 6;
                const tip = { x, y };
                const back = {
                    x: x - diamondLen * Math.cos(angle),
                    y: y - diamondLen * Math.sin(angle)
                };
                const left = {
                    x: x - (diamondLen / 2) * Math.cos(angle) - diamondWidth * Math.cos(angle - Math.PI / 2),
                    y: y - (diamondLen / 2) * Math.sin(angle) - diamondWidth * Math.sin(angle - Math.PI / 2)
                };
                const right = {
                    x: x - (diamondLen / 2) * Math.cos(angle) - diamondWidth * Math.cos(angle + Math.PI / 2),
                    y: y - (diamondLen / 2) * Math.sin(angle) - diamondWidth * Math.sin(angle + Math.PI / 2)
                };
                path = `M ${tip.x.toFixed(2)} ${tip.y.toFixed(2)} ` +
                    `L ${left.x.toFixed(2)} ${left.y.toFixed(2)} ` +
                    `L ${back.x.toFixed(2)} ${back.y.toFixed(2)} ` +
                    `L ${right.x.toFixed(2)} ${right.y.toFixed(2)} ` +
                    `L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`;
                break;

            case ArrowHeadStyle.CrowFootOne:
                // Short perpendicular line, positioned back from the tip (rotated T shape)
                const cf1BaseX = x - (headlen * 0.5) * Math.cos(angle);
                const cf1BaseY = y - (headlen * 0.5) * Math.sin(angle);
                const cf1X1 = cf1BaseX - (headlen / 3) * Math.cos(angle - Math.PI / 2);
                const cf1Y1 = cf1BaseY - (headlen / 3) * Math.sin(angle - Math.PI / 2);
                const cf1X2 = cf1BaseX - (headlen / 3) * Math.cos(angle + Math.PI / 2);
                const cf1Y2 = cf1BaseY - (headlen / 3) * Math.sin(angle + Math.PI / 2);
                path = `M ${cf1X1.toFixed(2)} ${cf1Y1.toFixed(2)} L ${cf1X2.toFixed(2)} ${cf1Y2.toFixed(2)}`;
                break;

            case ArrowHeadStyle.CrowFootMany:
                // Three lines spreading from a point back along the shaft, pointing inward (toward the arrow shaft)
                const cfmBaseX = x - (headlen * 0.6) * Math.cos(angle);
                const cfmBaseY = y - (headlen * 0.6) * Math.sin(angle);
                const cfmX1 = cfmBaseX + (headlen * 0.5) * Math.cos(angle - Math.PI / 6);
                const cfmY1 = cfmBaseY + (headlen * 0.5) * Math.sin(angle - Math.PI / 6);
                const cfmX2 = cfmBaseX + (headlen * 0.5) * Math.cos(angle + Math.PI / 6);
                const cfmY2 = cfmBaseY + (headlen * 0.5) * Math.sin(angle + Math.PI / 6);

                path = `M ${cfmX1.toFixed(2)} ${cfmY1.toFixed(2)} L ${cfmBaseX.toFixed(2)} ${cfmBaseY.toFixed(2)} ` +
                    `M ${cfmBaseX.toFixed(2)} ${cfmBaseY.toFixed(2)} L ${cfmX2.toFixed(2)} ${cfmY2.toFixed(2)} ` +
                    `M ${cfmBaseX.toFixed(2)} ${cfmBaseY.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)}`;
                break;

            case ArrowHeadStyle.CrowFootOneOrMany:
                // Combination of CrowFootOne + CrowFootMany
                // Two angled lines from the tip pointing inward (crow foot many part)
                const cfomBaseX = x - (headlen * 0.6) * Math.cos(angle);
                const cfomBaseY = y - (headlen * 0.6) * Math.sin(angle);
                const cfomX1 = cfomBaseX + (headlen * 0.6) * Math.cos(angle - Math.PI / 6);
                const cfomY1 = cfomBaseY + (headlen * 0.6) * Math.sin(angle - Math.PI / 6);
                const cfomX2 = cfomBaseX + (headlen * 0.6) * Math.cos(angle + Math.PI / 6);
                const cfomY2 = cfomBaseY + (headlen * 0.6) * Math.sin(angle + Math.PI / 6);

                // Perpendicular line behind the crow foot (crow foot one part)
                const cfomBarX1 = cfomBaseX - (headlen / 3) * Math.cos(angle - Math.PI / 2);
                const cfomBarY1 = cfomBaseY - (headlen / 3) * Math.sin(angle - Math.PI / 2);
                const cfomBarX2 = cfomBaseX - (headlen / 3) * Math.cos(angle + Math.PI / 2);
                const cfomBarY2 = cfomBaseY - (headlen / 3) * Math.sin(angle + Math.PI / 2);

                path = `M ${cfomX1.toFixed(2)} ${cfomY1.toFixed(2)} L ${cfomBaseX.toFixed(2)} ${cfomBaseY.toFixed(2)} ` +
                    `M ${cfomBaseX.toFixed(2)} ${cfomBaseY.toFixed(2)} L ${cfomX2.toFixed(2)} ${cfomY2.toFixed(2)} ` +
                    `M ${cfomBarX1.toFixed(2)} ${cfomBarY1.toFixed(2)} L ${cfomBarX2.toFixed(2)} ${cfomBarY2.toFixed(2)}`;
                break;

            default:
                // Keep default arrow
                break;
        }

        return path;
    }

    _render(ctx) {
        ctx.save();
        ctx.lineCap = "round";
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

    reconnectBindings() {
        if (!this.canvas) return;

        const objects = this.canvas.getObjects();

        // Reconnect start binding
        if (this.startBinding && this.startBinding.elementId && !this.startBinding.dispose) {
            const obj = objects.find(o => o.id === this.startBinding.elementId);
            if (obj) {
                this.startBinding.object = obj;
                this._attachBindingListener(this.startBinding, 'start');
            }
        }

        // Reconnect end binding
        if (this.endBinding && this.endBinding.elementId && !this.endBinding.dispose) {
            const obj = objects.find(o => o.id === this.endBinding.elementId);
            if (obj) {
                this.endBinding.object = obj;
                this._attachBindingListener(this.endBinding, 'end');
            }
        }
    }

    finalizePotentialBindings() {
        // Clear highlights before finalizing
        this._clearPotentialHighlights();

        // Finalize or remove END binding
        if (this._potentialEndBinding) {
            const { obj, x, y } = this._potentialEndBinding;

            this._createBinding(obj, x, y, "end");
        } else if (this.endBinding) {
            // No potential binding, but we had one before → remove it
            this._cleanupBinding("end");
            this.endBinding = null;
        }

        // Finalize or remove START binding
        if (this._potentialStartBinding) {
            const { obj, x, y } = this._potentialStartBinding;

            this._createBinding(obj, x, y, "start");
        } else if (this.startBinding) {
            // No potential binding, but we had one before → remove it
            this._cleanupBinding("start");
            this.startBinding = null;
        }

        // Clear temporary storage
        this._potentialEndBinding = null;
        this._potentialStartBinding = null;
    }


    clearBindings() {
        this._clearPotentialHighlights();
        this._cleanupBinding('end');
        this._cleanupBinding('start');
        this.endBinding = null;
        this.startBinding = null;
    }

    toObject(propertiesToInclude) {
        return {
            ...super.toObject(propertiesToInclude),
            id: this.id,
            editing: this.editing,
            path: this.path,
            points: this.points,
            roughOptions: this.roughOptions,
            startArrowHeadStyle: this.startArrowHeadStyle,
            endArrowHeadStyle: this.endArrowHeadStyle,
            startBinding: this.startBinding ? {
                elementId: this.startBinding.elementId,
                offsetX: this.startBinding.offsetX,
                offsetY: this.startBinding.offsetY
            } : null,
            endBinding: this.endBinding ? {
                elementId: this.endBinding.elementId,
                offsetX: this.endBinding.offsetX,
                offsetY: this.endBinding.offsetY
            } : null,
        };
    }
}

fabric.classRegistry.setClass(FabricRoughArrow);
fabric.classRegistry.setSVGClass(FabricRoughArrow);

