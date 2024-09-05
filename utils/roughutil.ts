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
