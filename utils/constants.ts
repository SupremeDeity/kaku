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
  "Arrow",
] as const;

export const drawingModesIconMap = {
  Draw: "ph:pencil-duotone",
  Ellipse: "ph:circle-bold",
  Rectangle: "ph:rectangle-bold",
  Diamond: "ph:diamond-bold",
  Text: "ph:text-t-bold",
  Select: "ph:cursor-duotone",
  Line: "material-symbols:pen-size-3",
  Arrow: "ph:arrow-bend-left-up-bold",
};

export const supportedFonts = ["Kalam", "Itim", "Virgil", "Just Another Hand"];
export const ROUNDABLES = ["fabricroughrectangle", "fabricroughdiamond"];

export const defaultBrushSettings = {
  color: "white",
  size: 16,
  thinning: 0.6,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: any) => Math.sin((t * Math.PI) / 2),
  simulatePressure: true,
};

export enum ArrowHeadStyle {
  "NoHead",
  "Head",
  "FilledHead",
}


interface roughShapeProps {
  roughOptions: Partial<Options>;
  rounded?: boolean;
  endArrowHeadStyle: ArrowHeadStyle
  startArrowHeadStyle: ArrowHeadStyle
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
  opacity: 1,
  // For the "Roundables"
  rounded: false,
  endArrowHeadStyle: ArrowHeadStyle.Head,
  startArrowHeadStyle: ArrowHeadStyle.NoHead,
  cornerStyle: "circle",
  roughOptions: {
    fillStyle: "solid",
    fill: "transparent",
    maxRandomnessOffset: 2,
    stroke: "#ffffff",
    roughness: 2,
    strokeWidth: 2,
    curveFitting: 1,
    curveTightness: 0,
    curveStepCount: 9,
    fillWeight: -1,
    hachureAngle: -41,
    hachureGap: -1,
    dashOffset: -1,
    zigzagOffset: -1,
    disableMultiStroke: false,
    disableMultiStrokeFill: false,
    preserveVertices: false,
    fillShapeRoughnessGain: 0.8,
  },
};