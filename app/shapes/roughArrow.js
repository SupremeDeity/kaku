import * as fabric from "fabric";
import rough from "roughjs";
import { ArrowHeadStyle, ArrowType } from "../utils/constants";
import { getLineAngle, generateUniqueId, isPointNearBoundingBox, movePathPoint } from "../utils/roughutil";

class ArrowPathManager {
    constructor(arrowType) {
        this.arrowType = arrowType;
    }

    createPathData(points) {
        const [x1, y1, x2, y2] = points;

        switch (this.arrowType) {
            case ArrowType.Sharp:
                return `M ${x1} ${y1} L 0 0 L ${x2} ${y2}`;
            case ArrowType.CurvedArrow:
                return `M ${x1} ${y1} Q 0 0 ${x2} ${y2}`;
            case ArrowType.ElbowArrow:
                // Future implementation
                const midX = (x1 + x2) / 2;
                return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
            default:
                return `M ${x1} ${y1} L ${x2} ${y2}`;
        }
    }

    extractEndpoints(path) {
        switch (this.arrowType) {
            case ArrowType.Sharp:
                // M x1 y1 L 0 0 L x2 y2
                return {
                    start: { x: path[0][1], y: path[0][2] },
                    end: { x: path[2][1], y: path[2][2] },
                    control: { x: path[1][1], y: path[1][2] }
                };

            case ArrowType.CurvedArrow:
                // M x1 y1 Q cx cy x2 y2
                return {
                    start: { x: path[0][1], y: path[0][2] },
                    end: { x: path[1][3], y: path[1][4] },
                    control: { x: path[1][1], y: path[1][2] }
                };

            case ArrowType.ElbowArrow:
                // M x1 y1 L midX y1 L midX y2 L x2 y2
                return {
                    start: { x: path[0][1], y: path[0][2] },
                    end: { x: path[3][1], y: path[3][2] },
                    control: { x: path[1][1], y: path[1][2] }
                };

            default:
                return {
                    start: { x: path[0][1], y: path[0][2] },
                    end: { x: path[1][1], y: path[1][2] }
                };
        }
    }

    calculateAngles(endpoints) {
        const { start, end, control } = endpoints;

        switch (this.arrowType) {
            case ArrowType.Sharp:
                return {
                    startAngle: getLineAngle(start.x - control.x, start.y - control.y),
                    endAngle: getLineAngle(end.x - control.x, end.y - control.y)
                };

            case ArrowType.CurvedArrow:
                return {
                    startAngle: getLineAngle(control.x - start.x, control.y - start.y),
                    endAngle: getLineAngle(end.x - control.x, end.y - control.y)
                };

            case ArrowType.ElbowArrow:
                return {
                    startAngle: getLineAngle(control.x - start.x, control.y - start.y),
                    endAngle: getLineAngle(end.x - control.x, end.y - control.y)
                };

            default:
                const angle = getLineAngle(end.x - start.x, end.y - start.y);
                return {
                    startAngle: angle + Math.PI,
                    endAngle: angle
                };
        }
    }

    getBindingConfig(bindingType) {
        switch (this.arrowType) {
            case ArrowType.Sharp:
                return bindingType === 'end'
                    ? { pathIndex1: 2, pathIndex2: 1 }
                    : { pathIndex1: 0, pathIndex2: 1 };

            case ArrowType.CurvedArrow:
                return bindingType === 'end'
                    ? { pathIndex1: 1, pathIndex2: 3 }
                    : { pathIndex1: 0, pathIndex2: 1 };

            case ArrowType.ElbowArrow:
                return bindingType === 'end'
                    ? { pathIndex1: 3, pathIndex2: 1 }
                    : { pathIndex1: 0, pathIndex2: 1 };

            default:
                return bindingType === 'end'
                    ? { pathIndex1: 1, pathIndex2: 1 }
                    : { pathIndex1: 0, pathIndex2: 1 };
        }
    }

    createScaledPath(path, pathOffset) {
        return path.map(segment => {
            const newSegment = [segment[0]]; // Keep command

            // Apply offset to all coordinate pairs
            for (let i = 1; i < segment.length; i += 2) {
                if (i + 1 < segment.length) {
                    newSegment.push(segment[i] - pathOffset.x);
                    newSegment.push(segment[i + 1] - pathOffset.y);
                } else {
                    newSegment.push(segment[i]);
                }
            }

            return newSegment;
        });
    }
}

export class FabricRoughArrow extends fabric.Path {
    static get type() {
        return "FabricRoughArrow";
    }

    constructor(path, options = {}) {
        super(path, options);
        this.name = "Arrow";
        this.points = options.points;
        this.roughOptions = options.roughOptions;
        this.roughOptions.preserveVertices = true;
        this.objectCaching = false;

        this.id = options.id || generateUniqueId();
        this.roughOptions.seed = this.roughOptions?.seed ?? Math.random() * 100;
        this.roughGenerator = rough.generator();

        this.left = this.left !== null && this.left !== 0 ? this.left : options.points[0];
        this.top = this.top !== null && this.top !== 0 ? this.top : options.points[1];

        this.startArrowHeadStyle = options.startArrowHeadStyle || ArrowHeadStyle.NoHead;
        this.endArrowHeadStyle = options.endArrowHeadStyle || ArrowHeadStyle.Head;
        this.arrowType = options.arrowType || ArrowType.Sharp;

        this.pathManager = new ArrowPathManager(this.arrowType);

        // Initialize bindings
        if (options.startBinding) {
            this.startBinding = { ...options.startBinding };
        }
        if (options.endBinding) {
            this.endBinding = { ...options.endBinding };
        }

        this._updateRoughArrow();
        this._setupControls();
        this._setupEventHandlers();
    }

    setArrowType(newArrowType) {
        if (this.arrowType === newArrowType) return;

        const currentEndpoints = this.pathManager.extractEndpoints(this.path);

        this.arrowType = newArrowType;
        this.pathManager = new ArrowPathManager(this.arrowType);

        this._reconstructPathForNewType(currentEndpoints);

        this._setupControls();
        this.setCoords();
        this.dirty = true;
    }

    _reconstructPathForNewType(endpoints) {
        const { start, end, control } = endpoints;

        // Store the binding information before reconstruction
        const startBindingInfo = this.startBinding ? {
            elementId: this.startBinding.elementId,
            offsetX: this.startBinding.offsetX,
            offsetY: this.startBinding.offsetY,
            object: this.startBinding.object
        } : null;

        const endBindingInfo = this.endBinding ? {
            elementId: this.endBinding.elementId,
            offsetX: this.endBinding.offsetX,
            offsetY: this.endBinding.offsetY,
            object: this.endBinding.object
        } : null;

        this.clearBindings();

        let newPathData;

        if (this.arrowType === ArrowType.Sharp) {
            // M x1 y1 L cx cy L x2 y2
            newPathData = `M ${start.x} ${start.y} L ${control.x} ${control.y} L ${end.x} ${end.y}`;
        } else if (this.arrowType === ArrowType.CurvedArrow) {
            // M x1 y1 Q cx cy x2 y2
            newPathData = `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
        } else if (this.arrowType === ArrowType.ElbowArrow) {
            // M x1 y1 L midX y1 L midX y2 L x2 y2
            const midX = (start.x + end.x) / 2;
            newPathData = `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
        }

        this.path = fabric.util.parsePath(newPathData);
        this._updateRoughArrow();

        if (startBindingInfo && startBindingInfo.object) {
            this._recreateBinding(startBindingInfo, 'start');
        }

        if (endBindingInfo && endBindingInfo.object) {
            this._recreateBinding(endBindingInfo, 'end');
        }
    }

    _recreateBinding(bindingInfo, bindingType) {
        const binding = {
            elementId: bindingInfo.elementId,
            offsetX: bindingInfo.offsetX,
            offsetY: bindingInfo.offsetY,
            object: bindingInfo.object
        };

        this._attachBindingListener(binding, bindingType);

        if (bindingType === "end") {
            this.endBinding = binding;
        } else {
            this.startBinding = binding;
        }
    }

    _setupControls() {
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
    }

    _setupEventHandlers() {
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
            const endpoints = this.pathManager.extractEndpoints(this.path);

            const startLocal = new fabric.Point(
                endpoints.start.x - this.pathOffset.x,
                endpoints.start.y - this.pathOffset.y
            );
            const endLocal = new fabric.Point(
                endpoints.end.x - this.pathOffset.x,
                endpoints.end.y - this.pathOffset.y
            );

            const startScene = startLocal.transform(matrix);
            const endScene = endLocal.transform(matrix);

            this._checkPotentialBindings(startScene.x, startScene.y, endScene.x, endScene.y);
            this.finalizePotentialBindings();
        });
    }

    _createMovingHandler(binding, pathIndex1, pathIndex2) {
        return () => {
            const newScenePoint = (binding.object.getCenterPoint()).add({
                x: binding.offsetX,
                y: binding.offsetY
            });

            movePathPoint(this, newScenePoint.x, newScenePoint.y, pathIndex1, pathIndex2);
            this.setCoords();
            this.update();
        };
    }

    _attachBindingListener(binding, bindingType) {
        const config = this.pathManager.getBindingConfig(bindingType);
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

        this._cleanupBinding(bindingType);
        this._attachBindingListener(binding, bindingType);

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

    _checkPotentialBindings(x1, y1, x2, y2) {
        const objects = this.canvas.getObjects();
        this._clearPotentialHighlights();

        let potentialEndBinding = null;
        let potentialStartBinding = null;
        let closestEndDistance = Infinity;
        let closestStartDistance = Infinity;

        for (const obj of objects) {
            if (obj.type === this.type) continue;

            const endPoint = new fabric.Point(x2, y2);
            const startPoint = new fabric.Point(x1, y1);

            if (isPointNearBoundingBox(endPoint, obj, 20)) {
                const objCenter = obj.getCenterPoint();
                const endDistance = endPoint.distanceFrom(objCenter);

                if (endDistance < closestEndDistance) {
                    closestEndDistance = endDistance;
                    potentialEndBinding = { obj, x: x2, y: y2 };
                }
            }

            if (isPointNearBoundingBox(startPoint, obj, 20)) {
                const objCenter = obj.getCenterPoint();
                const startDistance = startPoint.distanceFrom(objCenter);

                if (startDistance < closestStartDistance) {
                    closestStartDistance = startDistance;
                    potentialStartBinding = { obj, x: x1, y: y1 };
                }
            }
        }

        if (potentialEndBinding) {
            this._highlightObject(potentialEndBinding.obj);
        }
        if (potentialStartBinding && potentialStartBinding.obj !== potentialEndBinding?.obj) {
            this._highlightObject(potentialStartBinding.obj);
        }

        this._potentialEndBinding = potentialEndBinding;
        this._potentialStartBinding = potentialStartBinding;
    }

    _highlightObject(obj) {
        if (!obj._originalHighlightProps) {
            obj._originalHighlightProps = {
                shadow: obj.shadow
            };
        }

        obj.set({
            shadow: new fabric.Shadow({
                color: "#ffff",
                blur: 15,
                offsetX: 0,
                offsetY: 0
            })
        });

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

    _updateRoughArrow() {
        if (this.canvas && this.isDrawing) {
            this._checkPotentialBindings(...this.points);
        }

        if (this.isDrawing) {
            this._updateDrawingState();
        } else {
            this._updateFinalState();
        }
    }

    _updateDrawingState() {
        const [x1, y1, x2, y2] = this.points;
        const points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
        const bounds = fabric.util.makeBoundingBoxFromPoints(points);

        const widthSign = x2 >= x1 ? 1 : -1;
        const heightSign = y2 >= y1 ? 1 : -1;

        const originX = widthSign < 0 ? "right" : "left";
        const originY = heightSign < 0 ? "bottom" : "top";
        const relativeCenter = this.getRelativeCenterPoint();
        const constraint = this.translateToOriginPoint(relativeCenter, originX, originY);

        this.set({
            width: Math.abs(bounds.width),
            height: Math.abs(bounds.height),
        });
        this.setPositionByOrigin(constraint, originX, originY);

        const pathData = this.pathManager.createPathData([
            (-bounds.width / 2) * widthSign,
            (-bounds.height / 2) * heightSign,
            (bounds.width / 2) * widthSign,
            (bounds.height / 2) * heightSign,
        ]);

        this.path = fabric.util.parsePath(pathData);
        this.roughArrow = this.roughGenerator.path(
            fabric.util.joinPath(this.path),
            this.roughOptions
        );

        const endpoints = this.pathManager.extractEndpoints(this.path);
        const angles = this.pathManager.calculateAngles(endpoints);

        this._updateArrowHeads(
            endpoints.start.x, endpoints.start.y,
            endpoints.end.x, endpoints.end.y,
            angles.startAngle, angles.endAngle
        );
    }

    _updateFinalState() {
        const scaledPath = this.pathManager.createScaledPath(this.path, this.pathOffset);

        this.roughArrow = this.roughGenerator.path(
            fabric.util.joinPath(scaledPath),
            this.roughOptions
        );

        const endpoints = this.pathManager.extractEndpoints(this.path);
        const angles = this.pathManager.calculateAngles(endpoints);

        this._updateArrowHeads(
            endpoints.start.x - this.pathOffset.x,
            endpoints.start.y - this.pathOffset.y,
            endpoints.end.x - this.pathOffset.x,
            endpoints.end.y - this.pathOffset.y,
            angles.startAngle,
            angles.endAngle
        );
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
            // Use calculated start angle directly since pathManager handles direction
            const headPath = this._calculateHeadPath(x1, y1, angleStart);
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

        return `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)}`;
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

        if (this.startBinding && this.startBinding.elementId && !this.startBinding.dispose) {
            const obj = objects.find(o => o.id === this.startBinding.elementId);
            if (obj) {
                this.startBinding.object = obj;
                this._attachBindingListener(this.startBinding, 'start');
            }
        }

        if (this.endBinding && this.endBinding.elementId && !this.endBinding.dispose) {
            const obj = objects.find(o => o.id === this.endBinding.elementId);
            if (obj) {
                this.endBinding.object = obj;
                this._attachBindingListener(this.endBinding, 'end');
            }
        }
    }

    finalizePotentialBindings() {
        this._clearPotentialHighlights();

        if (this._potentialEndBinding) {
            const { obj, x, y } = this._potentialEndBinding;
            this._createBinding(obj, x, y, "end");
        } else if (this.endBinding) {
            this._cleanupBinding("end");
            this.endBinding = null;
        }

        if (this._potentialStartBinding) {
            const { obj, x, y } = this._potentialStartBinding;
            this._createBinding(obj, x, y, "start");
        } else if (this.startBinding) {
            this._cleanupBinding("start");
            this.startBinding = null;
        }

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
            arrowType: this.arrowType,
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