/**
 * Shared hero staging data.
 *
 * Imported by the WebGL scene and by `scripts/preview-hero-models.mjs`, so the
 * offline CPU previews always describe the composition that actually ships.
 *
 * The hero copy holds the left of the section on desktop, so the camera looks
 * left of the collection: every product then lands in the right of frame
 * without the models themselves moving. On narrow layouts the stage becomes its
 * own band under the copy, so the collection re-centres and grows.
 *
 * Positions are authored as screen intent ("this slot sits at 82% of the width
 * and is this large") and converted through the real camera basis, which keeps
 * the arrangement honest even though the camera is yawed and pitched.
 */

export type Pose = { x: number; y: number; z: number; scale: number; rotation: number };

type Vec3 = [number, number, number];
export type Framing = { fov: number; aspect: number; position: Vec3; target: Vec3 };

/** Native model footprint, measured from the procedural geometries. */
const NATIVE: Array<[number, number]> = [
  [3.23, 1.98], // dragon
  [3.47, 1.25], // car
  [1.37, 2.5], // vase
  [1.3, 2.57], // robot
];

/** Camera framing for a given canvas aspect ratio. */
export function heroCamera(aspect: number): Framing & { wide: boolean; distance: number } {
  const wide = aspect >= 1.15;
  const distance = wide ? 1 : 1.3;
  return {
    wide,
    distance,
    fov: wide ? 32 : 38,
    aspect,
    position: [0, 1.35 * distance, 6.2 * distance],
    target: [wide ? -1.15 : 0.55, wide ? 0.82 : 0.78, 0],
  };
}

const normalize = (v: Vec3): Vec3 => {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/** Screen-space helpers bound to one camera framing. */
function projector(framing: Framing) {
  const forward = normalize([
    framing.target[0] - framing.position[0],
    framing.target[1] - framing.position[1],
    framing.target[2] - framing.position[2],
  ]);
  const right = normalize(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const tan = Math.tan((framing.fov * Math.PI) / 360);

  const projectX = (x: number, y: number, z: number) => {
    const d: Vec3 = [x - framing.position[0], y - framing.position[1], z - framing.position[2]];
    const depth = d[0] * forward[0] + d[1] * forward[1] + d[2] * forward[2];
    const lateral = d[0] * right[0] + d[1] * right[1] + d[2] * right[2];
    return 0.5 + lateral / (depth * tan * framing.aspect) / 2;
  };

  /** Half the visible height at a given depth, in world units. */
  const halfHeight = (z: number) => tan * (framing.position[2] - z);

  /** World x that centres a product on `screen` (0–1) at chest height. */
  const worldX = (screen: number, z: number, y = 0.85) => {
    let low = -24;
    let high = 24;
    for (let step = 0; step < 44; step += 1) {
      const mid = (low + high) / 2;
      if (projectX(mid, y, z) < screen) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  };

  /**
   * Scale at which a model's longest dimension covers `target` of the frame
   * height. Normalising the longest side — rather than a diagonal — keeps a
   * wide dragon and a tall vase reading at the same weight instead of blowing
   * the tall pieces up.
   */
  const presence = (model: number, target: number, z: number) =>
    (target * 2 * halfHeight(z)) / Math.max(...NATIVE[model]);

  return { worldX, presence };
}

type Slot = { screen: number; z: number; size: number; rotation: number };

/* Desktop: a receding arc to the right of the copy. */
const WIDE_SLOTS: Slot[] = [
  { screen: 0.6, z: 0.4, size: 0.5, rotation: -0.24 },
  { screen: 0.47, z: -1.3, size: 0.18, rotation: 0.54 },
  { screen: 0.81, z: -2.3, size: 0.165, rotation: -0.44 },
  { screen: 0.94, z: -3.4, size: 0.14, rotation: 0.72 },
];

/* Narrow: the stage is its own band, so the collection fills the width. */
const NARROW_SLOTS: Slot[] = [
  { screen: 0.46, z: 0.3, size: 0.48, rotation: -0.22 },
  { screen: 0.19, z: -1.1, size: 0.2, rotation: 0.5 },
  { screen: 0.73, z: -1.8, size: 0.19, rotation: -0.4 },
  { screen: 0.92, z: -3, size: 0.15, rotation: 0.66 },
];

const WIDE_STUDIES: Array<{ model: number; screen: number; z: number; size: number; rotation: number }> = [
  { model: 2, screen: 0.735, z: -9.5, size: 0.075, rotation: 0.3 },
  { model: 1, screen: 0.9, z: -11, size: 0.08, rotation: -0.2 },
];

const NARROW_STUDIES = [
  { model: 2, screen: 0.64, z: -4.6, size: 0.12, rotation: 0.3 },
  { model: 1, screen: 0.34, z: -6, size: 0.1, rotation: -0.2 },
];

/** Poses for the four products, rotated so `featured` takes the front slot. */
export function stagePoses(featured: number, aspect = 1.895): Pose[] {
  const framing = heroCamera(aspect);
  const { worldX, presence } = projector(framing);
  const slots = framing.wide ? WIDE_SLOTS : NARROW_SLOTS;
  const poses: Pose[] = [];
  slots.forEach((slot, index) => {
    const model = (featured + index) % 4;
    poses[model] = {
      x: worldX(slot.screen, slot.z),
      y: 0,
      z: slot.z,
      scale: presence(model, slot.size, slot.z),
      rotation: slot.rotation,
    };
  });
  return poses;
}

/** Two extra depth studies (a vase and a car, re-staged smaller and deeper). */
export function stageStudies(aspect = 1.895): Array<Pose & { model: number }> {
  const framing = heroCamera(aspect);
  const { worldX, presence } = projector(framing);
  return (framing.wide ? WIDE_STUDIES : NARROW_STUDIES).map((study) => ({
    ...study,
    x: worldX(study.screen, study.z),
    y: 0,
    scale: presence(study.model, study.size, study.z),
  }));
}
