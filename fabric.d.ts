import type { roughShapeProps, SupportedFontsType } from "~/utils/constants";

declare module "fabric" {
  interface BaseBrush {
    freehandOptions: any;
  }
  interface FabricObject extends roughShapeProps {
    id: string;
    isDrawing?: boolean;
    name?: string;
    textAlign?: string;
    fontFamily?: SupportedFontsType;
  }
}