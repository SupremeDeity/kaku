import type { FabricObjectProps } from "fabric";
import type { Options } from "roughjs/bin/core";

export const drawingModes = [
  "Select",
  "Draw",
  "Ellipse",
  "Rectangle",
  "Diamond",
  "Text",
  "Line",
] as const;

export const drawingModesIconMap = {
  Select: "ph:cursor-duotone",
  Draw: "ph:pencil-duotone",
  Ellipse: "ph:circle-bold",
  Rectangle: "ph:rectangle-bold",
  Diamond: "ph:diamond-bold",
  Text: "ph:text-t-bold",
  Line: "ph:line-vertical-bold",
};

export const supportedFonts = ["Kalam", "Itim", "Virgil"];

export const defaultBrushSettings = {
  color: "white",
  size: 16,
  thinning: 0.6,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: any) => Math.sin((t * Math.PI) / 2),
  simulatePressure: true,
};

interface roughShapeProps {
  roughOptions: Partial<Options>;
}

export const defaultShapeSettings: Partial<FabricObjectProps> &
  roughShapeProps = {
  evented: false,
  selectable: false,
  // ? WARNING: origin is deprecated starting from fabric 6.4
  originX: "center",
  originY: "center",
  stroke: "white",
  strokeWidth: 2,
  roughOptions: {
    maxRandomnessOffset: 2,
    stroke: "white",
    roughness: 2,
    bowing: 2,
    strokeWidth: 2,
    seed: Math.random() * 100,
    curveFitting: 1,
    curveTightness: 0,
    curveStepCount: 9,
    fillWeight: -1,
    hachureAngle: -41,
    hachureGap: -1,
    dashOffset: -1,
    dashGap: -1,
    zigzagOffset: -1,
    disableMultiStroke: false,
    disableMultiStrokeFill: false,
    preserveVertices: false,
    fillShapeRoughnessGain: 0.8,
  },
};