import 'fabric';
import type { roughShapeProps, SupportedFontsType } from "~/utils/constants";

declare module "fabric" {
  interface BaseBrush {
    freehandOptions: any;
  }
  interface FabricObject extends roughShapeProps {
    isDrawing?: boolean;
    name?: string;
    textAlign?: string;
    fontFamily?: SupportedFontsType;
  }
}