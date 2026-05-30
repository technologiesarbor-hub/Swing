/**
 * The curvy path the paper plane traces when launched.
 *
 * Coordinates are relative to the card centre, in screen units (positive Y
 * is down). A single cubic Bezier from (0, 0) to (endX, endY) shaped into
 * a gentle "soaring" curve — the plane rises mostly straight up first,
 * then drifts right and up toward the destination.
 *
 * Control points are expressed as fractions of (endX, endY) so the shape
 * scales proportionally if you want to reuse this for a smaller render
 * surface later.
 *
 * Declared as a worklet so it can be called from either:
 *   - React render code (to position static trail dots), or
 *   - a Reanimated worklet (to animate the live plane position).
 *
 * NOTE: Reanimated 4's babel plugin does not reliably bundle helper
 * worklets called from another worklet — so all bezier math is inlined
 * here rather than factored into a shared `cubicBezier()` helper.
 */

export type PathPoint = { x: number; y: number };

export function planePath(t: number, endX = 300, endY = -900): PathPoint {
  'worklet';
  if (t <= 0) return { x: 0, y: 0 };
  if (t >= 1) return { x: endX, y: endY };

  // Cubic Bezier: P0 = (0, 0), P3 = (endX, endY).
  // P1 pulls slightly LEFT and UP → initial upward sweep.
  // P2 pulls toward the MIDDLE-and-UP → lets the plane drift back right.
  const p1x = endX * -0.2;
  const p1y = endY * 0.3;
  const p2x = endX * 0.5;
  const p2y = endY * 0.7;

  const u = 1 - t;
  return {
    x: 3 * u * u * t * p1x + 3 * u * t * t * p2x + t * t * t * endX,
    y: 3 * u * u * t * p1y + 3 * u * t * t * p2y + t * t * t * endY,
  };
}

/**
 * Offset to add to a tangent angle (in degrees) so that the paper-plane
 * Ionicons icon visually faces along the direction of travel. The icon
 * natively points to the upper-right (≈ -45° from the +X axis), so a
 * tangent of -45° corresponds to zero rotation.
 */
export const PLANE_ICON_ROTATION_OFFSET = 45;
