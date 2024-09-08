// Temporary very crude way to get the stroke style
// For use inside the properties panel
export function getStrokeStyle(strokeDash: any) {
  if (!strokeDash) return "Solid";
  switch (strokeDash[0]) {
    case 1.5:
      return ".Dotted";
    case 8:
      return "-Dashed";
    default:
      return "Solid";
  }
}

export function calculateStrokeStyle(strokeWidth: number, style: string) {
  switch (style) {
    case "Solid":
      return [];
    case "-Dashed":
      return [8, 8 + strokeWidth];
    case ".Dotted":
      return [1.5, 6 + strokeWidth];
  }
}

export function calculateCornerRadius(dim: number) {
        const DEFAULT_ADAPTIVE_RADIUS = 32;
        const DEFAULT_PROPORTIONAL_RADIUS = 0.25;
        const CUTOFF_SIZE = DEFAULT_ADAPTIVE_RADIUS / DEFAULT_PROPORTIONAL_RADIUS;

        // If the dimension is smaller than the cutoff, use proportional radius
        if (dim <= CUTOFF_SIZE) {
            return dim * DEFAULT_PROPORTIONAL_RADIUS;
        }

        // Otherwise, use the default adaptive radius
        return DEFAULT_ADAPTIVE_RADIUS;
    }