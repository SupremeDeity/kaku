import type { FabricObjectProps } from "fabric";
import type { Options } from "roughjs/bin/core";

export const drawingModes = [
  "Hand (Panning)",
  "Select",
  "Draw",
  "Ellipse",
  "Rectangle",
  "Diamond",
  "Text",
  "Line",
  "Arrow",
  "Image"
] as const;

export const drawingModesIconMap = {
  "Hand (Panning)": "ph:hand-duotone",
  Draw: "ph:pencil-duotone",
  Ellipse: "ph:circle-bold",
  Rectangle: "ph:rectangle-bold",
  Diamond: "ph:diamond-bold",
  Text: "ph:text-t-bold",
  Select: "ph:cursor-duotone",
  Line: "material-symbols:pen-size-3",
  Arrow: "ph:arrow-bend-left-up-bold",
  Image: "ph:image"
};

export const supportedFonts = ["Kalam", "Itim", "Virgil", "Just Another Hand"];
export type SupportedFontsType = typeof supportedFonts[number];
export const ROUNDABLES = ["fabricroughrectangle", "fabricroughdiamond"];

export const defaultBrushSettings = {
  color: "white",
  size: 8,
  thinning: 0.6,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: any) => Math.sin((t * Math.PI) / 2),
  simulatePressure: true,
};

export enum ArrowHeadStyle {
  "NoHead",
  "Arrow",
  "FilledTriangle",
  "Triangle",
  "Bar",
  "CrowFootOne",
  "CrowFootOneOrMany",
  "CrowFootMany",
  "FilledCircle",
  "Circle",
  "FilledDiamond",
  "Diamond",
}

export interface roughShapeProps {
  roughOptions: Partial<Options> & {roughness: number;};
  rounded?: boolean;
  endArrowHeadStyle: ArrowHeadStyle;
  startArrowHeadStyle: ArrowHeadStyle;
  fill?: string;
  fillStyle?: 'hachure' | 'cross-hatch' | 'solid';
  stroke?: string;
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
  rounded: true,
  endArrowHeadStyle: ArrowHeadStyle.Triangle,
  startArrowHeadStyle: ArrowHeadStyle.NoHead,
  cornerStyle: "circle",
  strokeLineCap: "round",
  padding: 4,
  roughOptions: {
    fillStyle: "solid",
    fill: "transparent",
    stroke: "#ffffff",
    roughness: 1.5,
    strokeWidth: 3,
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