// Temporary very crude way to get the stroke style

import { FabricObject, Intersection, Point } from "fabric";

// For use inside the properties panel
export function getStrokeStyle(strokeDash: any) {
  if (!strokeDash) return "Solid";
  switch (strokeDash[0]) {
    case 1.5:
      return "Dotted";
    case 8:
      return "Dashed";
    default:
      return "Solid";
  }
}

export function calculateStrokeStyle(strokeWidth: number, style: string) {
  switch (style) {
    case "Solid":
      return [];
    case "Dashed":
      return [8, strokeWidth + 8];
    case "Dotted":
      return [1.5,  strokeWidth + 6];
  }
}

export function calculateCornerRadius(dim: number, cutoff: boolean) {
  const DEFAULT_ADAPTIVE_RADIUS = 32;
  const DEFAULT_PROPORTIONAL_RADIUS = 0.25;
  const CUTOFF_SIZE = DEFAULT_ADAPTIVE_RADIUS / DEFAULT_PROPORTIONAL_RADIUS;

  // If the dimension is smaller than the cutoff, use proportional radius
  if (dim <= CUTOFF_SIZE || !cutoff) {
    return dim * DEFAULT_PROPORTIONAL_RADIUS;
  }

  // Otherwise, use the default adaptive radius
  return DEFAULT_ADAPTIVE_RADIUS;
}

/**
 * Gets the angle of the line
 * @param displacementX Displacement on the x axis (x2-x1)
 * @param displacementY Displacement on the y axis (y2-y1)
 * @returns 
 */
export function getLineAngle(displacementX: number, displacementY: number) {
  return Math.atan2(displacementY / 2 + displacementY / 2, displacementX / 2 + displacementX / 2);
}

/**
 * Check if a point is near or touching the bounding box of a Fabric object.
 * Assumes point is in scene coordinates.
 *
 * @param point The point (e.g. arrow start or end)
 * @param object The fabric object
 * @param threshold Distance to consider "near"
 * @returns true if point is near or touching the bounding box edge
 */
export function isPointNearBoundingBox(point: Point, object: FabricObject, threshold: number): boolean {
  // Ignore if the point is inside the object
  // if (object.containsPoint(point)) {
  //   console.log("Point is inside the object, ignoring");
  //   return false;
  // }

  const bboxCorners = object.getCoords(); // [tl, tr, br, bl] in scene plane
  for (let i = 0; i < bboxCorners.length; i++) {
    const A = bboxCorners[i];
    const B = bboxCorners[(i + 1) % bboxCorners.length];

    const distance = _distancePointToSegment(point, A, B);
    if (distance <= threshold) {
      return true;
    }
  }

  return false;
}

/**
 * Gets the shortest distance from a point to the line segment AB
 */
function _distancePointToSegment(P: Point, A: Point, B: Point): number {
  const AB = B.subtract(A);
  const AP = P.subtract(A);
  const ab2 = AB.x * AB.x + AB.y * AB.y;
  const ap_ab = AP.x * AB.x + AP.y * AB.y;
  let t = ab2 === 0 ? -1 : ap_ab / ab2;

  t = Math.max(0, Math.min(1, t));
  const closest = new Point(A.x + AB.x * t, A.y + AB.y * t);
  return P.distanceFrom(closest);
}