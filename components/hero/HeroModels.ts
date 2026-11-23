import * as THREE from "three";

/**
 * VEXAUSE LABS — hero product collection.
 *
 * Original procedural geometry only: every model here is built from primitives,
 * swept profiles and lathed silhouettes written specifically for this project.
 * No third-party or licensed models are used.
 *
 * All four products share one palette + finish family (matte printed body,
 * satin detail, graphite mechanical parts, lime accent, ceramic for the vase)
 * so the hero reads as a single designed collection rather than four demos.
 */

export const HERO_PALETTE = {
  forestDeep: 0x143529,
  forest: 0x1f4b3a,
  sage: 0x7ba791,
  sageLight: 0xaac4af,
  mist: 0xd7e0d5,
  paper: 0xe9ece1,
  clay: 0xbb9274,
  clayLight: 0xd8bda2,
  lime: 0xc8f36a,
  titanium: 0x98a5a1,
  graphite: 0x151c1a,
  ink: 0x090f0d,
  ember: 0xc9653f,
} as const;

type FinishKind = "matte" | "satin" | "ceramic" | "metal" | "rubber" | "glass" | "glow" | "membrane";

const FINISH_BASE: Record<FinishKind, THREE.MeshPhysicalMaterialParameters> = {
  matte: { roughness: 0.62, metalness: 0.02, clearcoat: 0.08, clearcoatRoughness: 0.7, envMapIntensity: 0.7 },
  satin: { roughness: 0.38, metalness: 0.06, clearcoat: 0.34, clearcoatRoughness: 0.42, envMapIntensity: 0.95 },
  ceramic: { roughness: 0.46, metalness: 0.01, clearcoat: 0.22, clearcoatRoughness: 0.55, sheen: 0.5, sheenRoughness: 0.7, envMapIntensity: 0.85 },
  metal: { roughness: 0.3, metalness: 0.88, clearcoat: 0.24, clearcoatRoughness: 0.3, envMapIntensity: 1.25 },
  rubber: { roughness: 0.92, metalness: 0.0, clearcoat: 0.0, envMapIntensity: 0.35 },
  glass: { roughness: 0.08, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.46, envMapIntensity: 1.5 },
  glow: { roughness: 0.24, metalness: 0.0, clearcoat: 0.6, envMapIntensity: 0.8 },
  membrane: { roughness: 0.74, metalness: 0.0, clearcoat: 0.1, side: THREE.DoubleSide, envMapIntensity: 0.6 },
};

export function finish(kind: FinishKind, color: number, extra: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({ color, ...FINISH_BASE[kind], ...extra });
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* -------------------------------------------------------------------------- */
/* Geometry helpers                                                            */
/* -------------------------------------------------------------------------- */

/** Rounded / chamfered box — the core volume language of the printed products. */
export function roundedBox(width: number, height: number, depth: number, radius = 0.06, bevelSegments = 3) {
  const r = Math.min(radius, width / 2.05, height / 2.05, depth / 2.05);
  const innerW = Math.max(0.01, width - r * 2);
  const innerH = Math.max(0.01, height - r * 2);
  const corner = Math.min(r * 0.85, innerW / 2.1, innerH / 2.1);
  const shape = new THREE.Shape();
  const x = -innerW / 2;
  const y = -innerH / 2;
  shape.moveTo(x + corner, y);
  shape.lineTo(x + innerW - corner, y);
  shape.quadraticCurveTo(x + innerW, y, x + innerW, y + corner);
  shape.lineTo(x + innerW, y + innerH - corner);
  shape.quadraticCurveTo(x + innerW, y + innerH, x + innerW - corner, y + innerH);
  shape.lineTo(x + corner, y + innerH);
  shape.quadraticCurveTo(x, y + innerH, x, y + innerH - corner);
  shape.lineTo(x, y + corner);
  shape.quadraticCurveTo(x, y, x + corner, y);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, depth - r * 2),
    bevelEnabled: true,
    bevelSegments,
    bevelSize: r,
    bevelThickness: r,
    curveSegments: 5,
    steps: 1,
  });
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Variable-radius sweep along a curve. Used for the dragon's spine, neck,
 * horns, limbs and tail — the taper is what makes the silhouette organic.
 */
export function sweepGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  radiusAt: (t: number) => number,
  tubularSegments = 48,
  radialSegments = 14,
) {
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= tubularSegments; i += 1) {
    const t = i / tubularSegments;
    const point = curve.getPointAt(t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];
    const radius = Math.max(0.0035, radiusAt(t));
    for (let j = 0; j <= radialSegments; j += 1) {
      const angle = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = Math.cos(angle);
      positions.push(
        point.x + radius * (cos * normal.x + sin * binormal.x),
        point.y + radius * (cos * normal.y + sin * binormal.y),
        point.z + radius * (cos * normal.z + sin * binormal.z),
      );
    }
  }
  for (let i = 0; i < tubularSegments; i += 1) {
    for (let j = 0; j < radialSegments; j += 1) {
      const a = i * (radialSegments + 1) + j;
      const b = a + radialSegments + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Lathe with a soft fluted surface — used for the designer vase body. */
export function flutedLathe(profile: THREE.Vector2[], flutes: number, depth: number, segments = 128, mask?: (t: number) => number) {
  const geometry = new THREE.LatheGeometry(profile, segments);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const heights = profile.map((point) => point.y);
  const minY = Math.min(...heights);
  const maxY = Math.max(...heights);
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const radius = Math.hypot(x, z);
    if (radius < 1e-4) continue;
    const angle = Math.atan2(z, x);
    const t = maxY === minY ? 0 : (y - minY) / (maxY - minY);
    const weight = mask ? mask(t) : 1;
    const wave = Math.sin(angle * flutes) * 0.65 + Math.sin(angle * flutes * 2.5 + 1.1) * 0.12;
    const nextRadius = radius * (1 + depth * weight * wave);
    position.setXYZ(i, Math.cos(angle) * nextRadius, y, Math.sin(angle) * nextRadius);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Smooth a coarse profile into a tensile, hand-drawn silhouette. */
function refineProfile(points: Array<[number, number]>, samples = 96) {
  const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
  return curve.getPoints(samples).map((point) => new THREE.Vector2(Math.max(0, point.x), point.y));
}

/** Squeeze a volume towards its roof — gives the car tumblehome. */
export function sculptTumblehome(geometry: THREE.BufferGeometry, factor: number, fromY: number, toY: number) {
  const position = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    const t = THREE.MathUtils.clamp((y - fromY) / Math.max(0.0001, toY - fromY), 0, 1);
    position.setZ(i, position.getZ(i) * (1 - factor * t * t));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
}

function add(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0],
  scale?: [number, number, number],
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function ringPair(parent: THREE.Object3D, radius: number, tube: number, material: THREE.Material, position: [number, number, number], rotation: [number, number, number] = [Math.PI / 2, 0, 0], tubular = 28) {
  return add(parent, new THREE.TorusGeometry(radius, tube, 6, tubular), material, position, rotation);
}

/** Two mirrored details in one call. */
function mirrored(parent: THREE.Object3D, build: (side: number) => void) {
  build(-1);
  build(1);
}

/* -------------------------------------------------------------------------- */
/* 01 — Articulated dragon                                                     */
/* -------------------------------------------------------------------------- */

export function createDragon() {
  const group = new THREE.Group();
  group.name = "dragon";

  const skin = finish("satin", HERO_PALETTE.forest, { roughness: 0.5, clearcoat: 0.18 });
  const skinLight = finish("satin", 0x2d6350, { roughness: 0.56, clearcoat: 0.12 });
  const belly = finish("matte", HERO_PALETTE.sage, { roughness: 0.62 });
  const blade = finish("satin", 0x4f8a6d, { roughness: 0.44, clearcoat: 0.24 });
  const membrane = finish("membrane", 0x2a5b47, { roughness: 0.78, clearcoat: 0.06 });
  const membraneBack = finish("membrane", 0x224b3b, { roughness: 0.8, clearcoat: 0.06 });
  const claw = finish("matte", 0xdfe2d2, { roughness: 0.46 });
  const horn = finish("satin", 0xd6d2bd, { roughness: 0.4, clearcoat: 0.32 });
  const eyeDark = finish("rubber", HERO_PALETTE.ink);
  const iris = finish("glow", HERO_PALETTE.lime, { emissive: 0x7fae2c, emissiveIntensity: 1.15, roughness: 0.24 });

  // Spine: squared stance, tail sweeping behind, neck rising into a proud head.
  const spineCurve = new THREE.CatmullRomCurve3(
    [
      V(-1.66, 0.34, 0.92),
      V(-1.46, 0.5, 0.7),
      V(-1.04, 0.68, 0.4),
      V(-0.56, 0.9, 0.12),
      V(-0.02, 0.96, 0.0),
      V(0.44, 1.0, -0.04),
      V(0.72, 1.16, -0.1),
      V(0.86, 1.38, -0.12),
      V(0.94, 1.54, -0.08),
    ],
    false,
    "catmullrom",
    0.4,
  );

  const spineGeometry = sweepGeometry(
    spineCurve,
    (t) => {
      if (t < 0.26) return 0.038 + t * 0.6;
      if (t < 0.58) return 0.194 + (t - 0.26) * 0.44;
      if (t < 0.76) return 0.335 - (t - 0.58) * 0.82;
      return 0.187 - (t - 0.76) * 0.12;
    },
    110,
    22,
  );
  add(group, spineGeometry, skin);

  // Haunch + shoulder mass: gives the body a sculpted, weight-bearing read.
  mirrored(group, (side) => {
    const haunch = add(group, new THREE.SphereGeometry(0.275, 26, 20), skin, [side * 0.24, 0.86, 0.13]);
    haunch.scale.set(1, 0.94, 1.16);
    const shoulder = add(group, new THREE.SphereGeometry(0.215, 24, 18), skin, [side * 0.23, 0.96, -0.16]);
    shoulder.scale.set(0.94, 0.9, 1.05);
  });

  // Belly scutes: flat overlapping plates hugging the underside.
  const bellyCount = 13;
  for (let i = 0; i < bellyCount; i += 1) {
    const t = 0.3 + (i / (bellyCount - 1)) * 0.42;
    const point = spineCurve.getPointAt(t);
    const tangent = spineCurve.getTangentAt(t).normalize();
    const radius = 0.2 + Math.sin(((t - 0.26) / 0.42) * Math.PI) * 0.14;
    const plate = new THREE.Mesh(roundedBox(radius * 1.28, 0.055, radius * 0.78, 0.022, 2), i % 4 === 0 ? skinLight : belly);
    plate.position.set(point.x, point.y - radius * 0.86, point.z + 0.01);
    plate.rotation.set(0.12, Math.atan2(tangent.x, tangent.z) - Math.PI / 2, 0);
    plate.castShadow = true;
    plate.receiveShadow = true;
    group.add(plate);
  }

  // Dorsal blades: swept-back fins, scaled to the body mass.
  const spikeCount = 14;
  for (let i = 0; i < spikeCount; i += 1) {
    const t = 0.14 + (i / (spikeCount - 1)) * 0.68;
    const point = spineCurve.getPointAt(t);
    const tangent = spineCurve.getTangentAt(t).normalize();
    const bodyRadius = 0.11 + Math.sin(((t - 0.1) / 0.74) * Math.PI) * 0.26;
    const scale = 0.62 + Math.sin(((t - 0.08) / 0.78) * Math.PI) * 0.52;
    const base = point.clone().add(V(0, bodyRadius * 0.94, 0));
    const tip = base.clone().add(V(-tangent.x * 0.3 * scale, 0.2 * scale + 0.05, -tangent.z * 0.3 * scale));
    const bladeMesh = add(
      group,
      sweepGeometry(new THREE.CatmullRomCurve3([base, base.clone().lerp(tip, 0.55), tip]), (u) => (1 - u) * 0.048 * scale + 0.004, 10, 6),
      blade,
    );
    bladeMesh.scale.set(1, 1, 0.42);
  }

  // Head assembly (local +Z is the snout direction).
  const head = new THREE.Group();
  head.name = "dragon-head";
  // cranium + heavy brow
  add(head, roundedBox(0.33, 0.27, 0.34, 0.1, 4), skin, [0, 0.15, -0.02]);
  add(head, roundedBox(0.36, 0.075, 0.2, 0.03, 3), skin, [0, 0.255, 0.05], [0.16, 0, 0]);
  mirrored(head, (side) => {
    add(head, sweepGeometry(new THREE.CatmullRomCurve3([
      V(side * 0.16, 0.25, 0.1),
      V(side * 0.15, 0.29, -0.03),
      V(side * 0.09, 0.28, -0.14),
    ]), (t) => 0.035 - t * 0.018, 12, 7), skin);
  });
  // muzzle: long, tapered, with a defined nose bridge
  add(head, sweepGeometry(new THREE.CatmullRomCurve3([V(0, 0.12, 0.1), V(0, 0.105, 0.3), V(0, 0.095, 0.46)]), (t) => 0.115 - t * 0.048, 18, 14), skinLight);
  add(head, roundedBox(0.1, 0.06, 0.16, 0.028, 3), skin, [0, 0.15, 0.28]);
  add(head, roundedBox(0.12, 0.075, 0.1, 0.034, 3), skinLight, [0, 0.085, 0.46]);
  // jaw + teeth
  add(head, roundedBox(0.23, 0.075, 0.34, 0.034, 3), skinLight, [0, 0.02, 0.24], [-0.09, 0, 0]);
  add(head, roundedBox(0.16, 0.03, 0.22, 0.012, 2), eyeDark, [0, 0.058, 0.26], [-0.09, 0, 0]);
  for (let tooth = 0; tooth < 4; tooth += 1) {
    mirrored(head, (side) => {
      add(head, new THREE.ConeGeometry(0.011, 0.042, 5), claw, [side * (0.082 - tooth * 0.007), 0.052, 0.16 + tooth * 0.07], [Math.PI, 0, 0]);
    });
  }
  // eyes set under the brow, nostrils at the snout tip
  mirrored(head, (side) => {
    add(head, new THREE.SphereGeometry(0.022, 10, 8), eyeDark, [side * 0.075, 0.125, 0.44]);
    const socket = add(head, new THREE.SphereGeometry(0.062, 18, 14), eyeDark, [side * 0.145, 0.19, 0.075]);
    socket.scale.set(1, 1.05, 0.9);
    add(head, new THREE.SphereGeometry(0.03, 16, 12), iris, [side * 0.171, 0.196, 0.096]);
    const pupil = add(head, new THREE.SphereGeometry(0.014, 12, 10), eyeDark, [side * 0.192, 0.196, 0.105]);
    pupil.scale.set(0.75, 1.3, 0.5);
    // cheek scale + jaw spur
    const cheek = add(head, new THREE.SphereGeometry(0.062, 14, 12), skinLight, [side * 0.155, 0.07, -0.04]);
    cheek.scale.set(0.6, 1, 1.2);
    add(head, new THREE.ConeGeometry(0.026, 0.11, 6), horn, [side * 0.17, 0.05, -0.18], [-2.15, 0, side * 0.3]);
  });
  // horns: long swept pair + secondary pair, angled back rather than up
  mirrored(head, (side) => {
    add(head, sweepGeometry(new THREE.CatmullRomCurve3([
      V(side * 0.125, 0.245, -0.05),
      V(side * 0.205, 0.3, -0.26),
      V(side * 0.25, 0.31, -0.48),
      V(side * 0.235, 0.27, -0.66),
    ]), (t) => 0.052 - t * 0.047, 26, 10), horn);
    add(head, sweepGeometry(new THREE.CatmullRomCurve3([
      V(side * 0.175, 0.12, -0.08),
      V(side * 0.27, 0.17, -0.26),
      V(side * 0.29, 0.15, -0.42),
    ]), (t) => 0.034 - t * 0.029, 18, 8), horn);
  });
  // crown crest
  for (let i = 0; i < 2; i += 1) {
    add(head, new THREE.ConeGeometry(0.028 - i * 0.006, 0.12 - i * 0.02, 6), blade, [0, 0.31 + i * 0.008, -0.06 - i * 0.09], [-0.7 - i * 0.12, 0, 0]);
  }
  // neck frill: small blades continuing the dorsal line
  for (let i = 0; i < 4; i += 1) {
    const neckPoint = spineCurve.getPointAt(0.84 + i * 0.03);
    add(group, new THREE.ConeGeometry(0.03 - i * 0.003, 0.11 - i * 0.008, 5), blade, [neckPoint.x - 0.02, neckPoint.y + 0.15, neckPoint.z - 0.06], [-0.9, 0, 0]);
  }
  head.position.copy(spineCurve.getPointAt(1)).add(V(0, 0.02, 0.04));
  head.scale.setScalar(1.16);
  head.rotation.set(-0.1, 0.46, -0.04);
  group.add(head);

  // Folded wings: a raised leading-edge bone, layered sail blades tucked along
  // the flank — a sculptural read rather than a flat open wing.
  const wingMembrane = finish("membrane", 0x2c5d49, { roughness: 0.76, clearcoat: 0.08 });
  const wingMembraneDark = finish("membrane", 0x224b3a, { roughness: 0.8, clearcoat: 0.06 });
  const buildFoldedWing = (side: number) => {
    const root = V(side * 0.34, 0.98, -0.26);
    // leading edge folds low over the back and ends in a small claw
    const elbow = V(side * 0.6, 1.32, -0.46);
    const wrist = V(side * 0.56, 1.48, -0.6);
    const clawTip = V(side * 0.52, 1.55, -0.72);
    add(group, sweepGeometry(new THREE.CatmullRomCurve3([root, elbow, wrist]), (t) => 0.072 - t * 0.026, 22, 11), skin);
    add(group, sweepGeometry(new THREE.CatmullRomCurve3([wrist, clawTip]), (t) => 0.03 - t * 0.024, 10, 7), claw);

    // three sail folds tucked back along the flank
    const folds: Array<[number, number, number, number, THREE.Material]> = [
      [1.4, -0.52, 1.16, -0.58, wingMembrane],
      [1.24, -0.58, 0.98, -0.56, wingMembraneDark],
      [1.06, -0.6, 0.86, -0.52, wingMembrane],
    ];
    folds.forEach(([topY, topZ, tailY, tailZ, shade], index) => {
      const start = V(side * (0.5 - index * 0.04), topY, topZ);
      const mid = V(side * (0.62 - index * 0.06), (topY + tailY) / 2 - 0.02, (topZ + tailZ) / 2 - 0.12);
      const end = V(side * (0.5 - index * 0.03), tailY, tailZ);
      const blade = sweepGeometry(
        new THREE.CatmullRomCurve3([start, mid, end]),
        (t) => 0.24 - t * 0.225,
        26,
        10,
      );
      const mesh = add(group, blade, shade);
      mesh.scale.set(1, 1, 0.16);
      mesh.castShadow = true;
    });

    // shoulder cover plate
    const plate = add(group, new THREE.SphereGeometry(0.16, 18, 14), skin, [side * 0.34, 1.1, -0.22]);
    plate.scale.set(0.8, 0.9, 0.7);
  };
  mirrored(group, buildFoldedWing);

  // Limbs: digitigrade rear, straighter front, all with clawed feet.
  const buildLeg = (hip: THREE.Vector3, knee: THREE.Vector3, ankle: THREE.Vector3, foot: THREE.Vector3, scale: number, rear: boolean) => {
    add(group, sweepGeometry(new THREE.CatmullRomCurve3([hip, knee]), (t) => (0.13 - t * 0.045) * scale, 18, 12), skin);
    add(group, new THREE.SphereGeometry(0.1 * scale, 16, 13), skinLight, [knee.x, knee.y, knee.z]);
    add(group, sweepGeometry(new THREE.CatmullRomCurve3([knee, ankle]), (t) => (0.085 - t * 0.024) * scale, 18, 12), skin);
    add(group, new THREE.SphereGeometry(0.07 * scale, 14, 11), skinLight, [ankle.x, ankle.y, ankle.z]);
    add(group, sweepGeometry(new THREE.CatmullRomCurve3([ankle, foot]), (t) => (0.062 - t * 0.012) * scale, 14, 10), skin);
    add(group, roundedBox(0.21 * scale, 0.075 * scale, 0.24 * scale, 0.032, 2), skinLight, [foot.x, foot.y - 0.015, foot.z + 0.05]);
    if (rear) {
      // rear dew claw
      add(group, new THREE.ConeGeometry(0.026 * scale, 0.11 * scale, 6), claw, [foot.x, foot.y + 0.02, foot.z - 0.09], [-1.9, 0, 0]);
    }
    for (let toe = -1; toe <= 1; toe += 1) {
      const toeStart = V(foot.x + toe * 0.07 * scale, foot.y - 0.015, foot.z + 0.13);
      const toeEnd = V(foot.x + toe * 0.095 * scale, foot.y - 0.025, foot.z + 0.27);
      add(group, sweepGeometry(new THREE.CatmullRomCurve3([toeStart, toeEnd]), (t) => (0.034 - t * 0.021) * scale, 10, 8), skin);
      add(group, new THREE.ConeGeometry(0.024 * scale, 0.1 * scale, 6), claw, [toeEnd.x, toeEnd.y + 0.005, toeEnd.z + 0.05], [1.35, 0, 0]);
    }
  };
  mirrored(group, (side) => {
    buildLeg(V(side * 0.3, 0.92, 0.14), V(side * 0.48, 0.6, 0.32), V(side * 0.46, 0.18, 0.14), V(side * 0.46, 0.06, 0.06), 1.12, true);
    buildLeg(V(side * 0.26, 0.98, -0.18), V(side * 0.44, 0.62, -0.34), V(side * 0.46, 0.18, -0.26), V(side * 0.47, 0.06, -0.3), 1.06, false);
  });

  // Tail fin: a thin vertical leaf at the very tip.
  const tailTip = spineCurve.getPointAt(0.0);
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.quadraticCurveTo(-0.1, 0.14, -0.26, 0.2);
  finShape.quadraticCurveTo(-0.16, 0.05, -0.36, -0.06);
  finShape.quadraticCurveTo(-0.18, -0.06, 0, 0);
  const finGeometry = new THREE.ExtrudeGeometry(finShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 10 });
  finGeometry.center();
  add(group, finGeometry, membraneBack, [tailTip.x - 0.05, tailTip.y + 0.02, tailTip.z], [0, 0, 0.12]);

  return group;
}

/* -------------------------------------------------------------------------- */
/* 02 — Miniature car                                                          */
/* -------------------------------------------------------------------------- */

export function createCar() {
  const group = new THREE.Group();
  group.name = "car";

  const paint = finish("satin", HERO_PALETTE.forestDeep, { roughness: 0.23, clearcoat: 0.92, clearcoatRoughness: 0.13, metalness: 0.24, envMapIntensity: 1.4 });
  const paintDark = finish("satin", 0x0a1812, { roughness: 0.32, clearcoat: 0.66, metalness: 0.26 });
  const glass = finish("glass", 0x8fb8aa, { opacity: 0.4, roughness: 0.06 });
  const trim = finish("metal", 0xb6bcb2, { roughness: 0.22, metalness: 0.94 });
  const rubber = finish("rubber", 0x0e1311);
  const lightWarm = finish("glow", 0xf3efd8, { emissive: 0xfff2c8, emissiveIntensity: 1.1 });
  const lightRed = finish("glow", 0xc9533a, { emissive: 0xbd2f1c, emissiveIntensity: 1.2 });
  const interior = finish("matte", 0x141d1a, { roughness: 0.86 });
  const seat = finish("matte", 0x2c3a34, { roughness: 0.9 });
  const caliper = finish("satin", HERO_PALETTE.lime, { roughness: 0.42 });

  const WHEEL_R = 0.37;
  const lift = 0.19; // body sits above the wheel centres

  // --- lower body tub: sill, haunches, long bonnet, clipped rear deck -------
  const body = new THREE.Shape();
  body.moveTo(-1.6, 0.02);
  body.quadraticCurveTo(-1.66, 0.28, -1.6, 0.46);
  body.quadraticCurveTo(-1.56, 0.58, -1.42, 0.6);
  body.lineTo(-0.84, 0.64);
  body.lineTo(0.86, 0.64);
  body.quadraticCurveTo(1.14, 0.63, 1.3, 0.57);
  body.quadraticCurveTo(1.56, 0.5, 1.62, 0.34);
  body.quadraticCurveTo(1.66, 0.18, 1.58, 0.08);
  body.quadraticCurveTo(1.5, 0.02, 1.32, 0.02);
  body.lineTo(-1.44, 0.02);
  body.quadraticCurveTo(-1.56, 0.02, -1.6, 0.02);

  const bodyGeometry = new THREE.ExtrudeGeometry(body, {
    depth: 0.7,
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    curveSegments: 20,
    steps: 1,
  });
  bodyGeometry.translate(0, 0, -0.35);
  sculptTumblehome(bodyGeometry, 0.14, 0.2, 0.66);
  add(group, bodyGeometry, paint, [0, lift, 0]);

  // --- cabin: narrower glasshouse with painted pillars and roof ------------
  const cabin = new THREE.Shape();
  cabin.moveTo(-0.68, 0.6);
  cabin.quadraticCurveTo(-0.64, 0.82, -0.5, 0.94);
  cabin.quadraticCurveTo(-0.42, 1.0, -0.28, 1.0);
  cabin.lineTo(0.16, 1.0);
  cabin.quadraticCurveTo(0.3, 0.99, 0.38, 0.93);
  cabin.lineTo(0.62, 0.8);
  cabin.lineTo(0.88, 0.62);
  cabin.lineTo(-0.68, 0.6);

  const cabinGeometry = new THREE.ExtrudeGeometry(cabin, {
    depth: 0.56,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.028,
    bevelThickness: 0.028,
    curveSegments: 14,
  });
  cabinGeometry.translate(0, 0, -0.28);
  sculptTumblehome(cabinGeometry, 0.36, 0.6, 1.0);
  add(group, cabinGeometry, glass, [0, lift, 0]);

  // roof skin + pillars + beltline trim
  add(group, roundedBox(0.5, 0.06, 0.42, 0.028, 3), paint, [-0.06, lift + 1.0, 0]);
  add(group, roundedBox(0.3, 0.03, 0.3, 0.014, 2), paint, [-0.06, lift + 1.045, 0]);
  mirrored(group, (side) => {
    // A pillar
    add(group, roundedBox(0.055, 0.38, 0.05, 0.018, 2), paint, [0.48, lift + 0.83, side * 0.25], [0, 0, -0.5]);
    // C pillar
    add(group, roundedBox(0.09, 0.36, 0.06, 0.02, 2), paint, [-0.56, lift + 0.82, side * 0.235], [0, 0, 0.42]);
    // B pillar
    add(group, roundedBox(0.05, 0.4, 0.045, 0.015, 2), paint, [-0.04, lift + 0.82, side * 0.255]);
    // window sill
    add(group, roundedBox(0.62, 0.035, 0.05, 0.012, 2), paintDark, [0.0, lift + 0.66, side * 0.27]);
    // side skirt shadow line
    add(group, roundedBox(1.2, 0.06, 0.02, 0.01, 1), paintDark, [0.0, lift + 0.16, side * 0.365]);
  });

  // Cabin interior: seats, dash, wheel glimpse.
  mirrored(group, (side) => {
    add(group, roundedBox(0.26, 0.3, 0.22, 0.07, 2), seat, [-0.16, lift + 0.78, side * 0.15]);
    add(group, roundedBox(0.2, 0.1, 0.18, 0.04, 2), seat, [-0.08, lift + 0.94, side * 0.15]);
  });
  add(group, roundedBox(0.9, 0.07, 0.32, 0.03, 2), interior, [0.34, lift + 0.8, 0], [0, 0, 0.1]);
  add(group, new THREE.TorusGeometry(0.09, 0.016, 6, 20), interior, [0.24, lift + 0.82, 0.15], [0.5, 0, 0]);

  // --- wheels --------------------------------------------------------------
  const buildWheel = (x: number, z: number) => {
    const side = Math.sign(z);
    add(group, new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.24, 36, 1), rubber, [x, WHEEL_R, z], [Math.PI / 2, 0, 0]);
    add(group, new THREE.CylinderGeometry(WHEEL_R * 0.86, WHEEL_R * 0.86, 0.255, 36, 1), rubber, [x, WHEEL_R, z], [Math.PI / 2, 0, 0]);
    add(group, new THREE.CylinderGeometry(0.245, 0.245, 0.05, 32), trim, [x, WHEEL_R, z + side * 0.105], [Math.PI / 2, 0, 0]);
    add(group, new THREE.CylinderGeometry(0.2, 0.2, 0.055, 32), paintDark, [x, WHEEL_R, z + side * 0.115], [Math.PI / 2, 0, 0]);
    for (let spoke = 0; spoke < 6; spoke += 1) {
      add(group, roundedBox(0.042, 0.17, 0.02, 0.012, 2), trim, [x, WHEEL_R, z + side * 0.13], [0, 0, (spoke / 6) * Math.PI * 2]);
    }
    add(group, new THREE.CylinderGeometry(0.055, 0.055, 0.1, 18), trim, [x, WHEEL_R, z + side * 0.14], [Math.PI / 2, 0, 0]);
    add(group, new THREE.CylinderGeometry(0.028, 0.028, 0.04, 12), paintDark, [x, WHEEL_R, z + side * 0.155], [Math.PI / 2, 0, 0]);
    add(group, roundedBox(0.08, 0.15, 0.035, 0.018, 2), caliper, [x - 0.13, WHEEL_R + 0.04, z + side * 0.055]);
    // arch flare hugging the tyre
    add(group, new THREE.TorusGeometry(WHEEL_R + 0.05, 0.033, 8, 30, Math.PI), paintDark, [x, WHEEL_R, z + side * 0.04], [0, Math.PI / 2, 0]);
  };
  [[-0.98, 0.4], [-0.98, -0.4], [0.96, 0.4], [0.96, -0.4]].forEach(([x, z]) => buildWheel(x, z));

  // --- front fascia --------------------------------------------------------
  add(group, roundedBox(0.07, 0.15, 0.4, 0.03, 2), paintDark, [1.7, lift + 0.16, 0]);
  for (let i = 0; i < 3; i += 1) {
    add(group, roundedBox(0.04, 0.016, 0.32, 0.006, 2), trim, [1.725, lift + 0.12 + i * 0.05, 0]);
  }
  add(group, roundedBox(0.05, 0.035, 0.32, 0.01, 2), paintDark, [1.7, lift + 0.05, 0]);
  mirrored(group, (side) => {
    add(group, roundedBox(0.04, 0.075, 0.22, 0.018, 3), paintDark, [1.69, lift + 0.29, side * 0.25]);
    add(group, roundedBox(0.05, 0.055, 0.18, 0.02, 3), lightWarm, [1.72, lift + 0.29, side * 0.25]);
    add(group, roundedBox(0.03, 0.12, 0.07, 0.01, 2), trim, [1.71, lift + 0.11, side * 0.27]);
    add(group, roundedBox(0.1, 0.05, 0.025, 0.01, 2), trim, [0.6, lift + 0.34, side * 0.36], [0, 0, -0.16]);
  });
  add(group, roundedBox(0.1, 0.028, 0.66, 0.01, 2), paintDark, [1.62, lift - 0.14, 0]);

  // --- rear end ------------------------------------------------------------
  add(group, roundedBox(0.05, 0.06, 0.52, 0.022, 2), lightRed, [-1.7, lift + 0.3, 0]);
  mirrored(group, (side) => {
    add(group, roundedBox(0.05, 0.035, 0.09, 0.014, 2), lightRed, [-1.7, lift + 0.24, side * 0.2]);
    add(group, roundedBox(0.08, 0.09, 0.11, 0.028, 2), paintDark, [-1.52, lift + 0.2, side * 0.29]);
    add(group, new THREE.CylinderGeometry(0.038, 0.038, 0.1, 14), trim, [-1.66, lift - 0.1, side * 0.18], [0, 0, Math.PI / 2]);
  });
  // ducktail lip attached to the deck, not floating
  add(group, roundedBox(0.2, 0.04, 0.62, 0.016, 2), paint, [-1.46, lift + 0.55, 0], [0, 0, 0.2]);
  add(group, roundedBox(0.1, 0.1, 0.66, 0.02, 2), interior, [-1.58, lift + 0.02, 0]);
  add(group, roundedBox(0.18, 0.1, 0.5, 0.02, 2), paintDark, [-1.55, lift - 0.1, 0]);

  // --- seams, handles, mirrors --------------------------------------------
  mirrored(group, (side) => {
    add(group, roundedBox(0.035, 0.34, 0.012, 0.004, 1), paintDark, [-0.02, lift + 0.38, side * 0.362], [0, 0, 0.05]);
    add(group, roundedBox(0.03, 0.3, 0.012, 0.004, 1), paintDark, [-0.66, lift + 0.4, side * 0.355], [0, 0, 0.14]);
    add(group, roundedBox(0.1, 0.028, 0.025, 0.01, 2), trim, [-0.2, lift + 0.44, side * 0.37]);
    add(group, roundedBox(0.07, 0.045, 0.05, 0.016, 2), paintDark, [0.46, lift + 0.62, side * 0.31]);
    add(group, roundedBox(0.09, 0.055, 0.02, 0.018, 2), trim, [0.43, lift + 0.63, side * 0.35], [0, side * 0.28, 0]);
  });

  return group;
}

/* -------------------------------------------------------------------------- */
/* 03 — Designer vase                                                          */
/* -------------------------------------------------------------------------- */

export function createVase() {
  const group = new THREE.Group();
  group.name = "vase";

  const ceramic = finish("ceramic", HERO_PALETTE.clayLight, { roughness: 0.52, clearcoat: 0.18, envMapIntensity: 0.8 });
  const glaze = finish("ceramic", HERO_PALETTE.forestDeep, { roughness: 0.34, clearcoat: 0.45 });
  const stone = finish("matte", 0xc9c3b1, { roughness: 0.8 });

  const profile = refineProfile([
    [0, 0.0],
    [0.42, 0.0],
    [0.46, 0.035],
    [0.44, 0.1],
    [0.52, 0.16],
    [0.62, 0.34],
    [0.67, 0.56],
    [0.63, 0.86],
    [0.52, 1.16],
    [0.435, 1.42],
    [0.43, 1.62],
    [0.48, 1.9],
    [0.585, 2.16],
    [0.63, 2.36],
    [0.6, 2.46],
    [0.55, 2.5],
    [0.5, 2.48],
    [0.47, 2.36],
    [0.455, 2.16],
    [0.4, 1.94],
    [0.35, 1.72],
    [0.345, 1.5],
    [0.38, 1.24],
    [0.44, 1.06],
    [0.45, 0.86],
    [0.4, 0.66],
    [0.29, 0.5],
    [0.12, 0.44],
    [0, 0.44],
  ], 132);

  const body = flutedLathe(profile, 34, 0.042, 220, (t) => {
    // flutes fade out at the foot and at the rolled lip
    const fadeIn = THREE.MathUtils.smoothstep(t, 0.05, 0.22);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(t, 0.72, 0.95);
    return fadeIn * fadeOut;
  });
  add(group, body, ceramic);

  // Glazed inner mouth reads as a deep well from the hero camera.
  const innerWall = add(group, new THREE.CylinderGeometry(0.44, 0.3, 0.95, 64, 1, true), glaze, [0, 2.02, 0]);
  innerWall.material.side = THREE.DoubleSide;
  const innerWell = add(group, new THREE.CircleGeometry(0.3, 64), glaze, [0, 1.56, 0], [-Math.PI / 2, 0, 0]);
  innerWell.receiveShadow = true;

  // Foot ring + maker's mark (radius follows the profile exactly).
  ringPair(group, 0.437, 0.012, stone, [0, 0.055, 0]);
  add(group, new THREE.CylinderGeometry(0.055, 0.055, 0.007, 20), stone, [0, 0.03, 0.4]);

  return group;
}

/* -------------------------------------------------------------------------- */
/* 04 — Robot collectible                                                      */
/* -------------------------------------------------------------------------- */

export function createRobot() {
  const group = new THREE.Group();
  group.name = "robot";

  const shell = finish("satin", HERO_PALETTE.titanium, { roughness: 0.34, clearcoat: 0.42, metalness: 0.12, envMapIntensity: 1.05 });
  const shellDark = finish("satin", 0x6d7d78, { roughness: 0.38, clearcoat: 0.3, metalness: 0.16 });
  const panel = finish("satin", HERO_PALETTE.forest, { roughness: 0.3, clearcoat: 0.55, metalness: 0.06 });
  const joint = finish("metal", 0x8d9994, { roughness: 0.34 });
  const rubber = finish("rubber", 0x141a18);
  const accent = finish("satin", HERO_PALETTE.lime, { roughness: 0.32, clearcoat: 0.6 });
  const eyeGlow = finish("glow", HERO_PALETTE.lime, { emissive: 0x9ec93f, emissiveIntensity: 1.6, roughness: 0.18 });
  const visor = finish("glass", 0x0d1512, { opacity: 0.94, roughness: 0.12, metalness: 0.4, clearcoat: 1 });

  const buildLeg = (side: number) => {
    const hip = V(side * 0.27, 0.93, 0);
    const knee = V(side * 0.3, 0.58, 0.02);
    const ankle = V(side * 0.29, 0.23, 0);
    // thigh: limb core + one sculpted guard
    add(group, new THREE.CapsuleGeometry(0.108, 0.2, 6, 14), shellDark, [hip.x, 0.77, hip.z]);
    add(group, roundedBox(0.19, 0.27, 0.21, 0.06, 3), panel, [hip.x, 0.78, hip.z + 0.02], [0.05, 0, 0]);
    add(group, roundedBox(0.2, 0.06, 0.17, 0.028, 2), shell, [hip.x, 0.9, hip.z + 0.04], [0.05, 0, 0]);
    // knee
    add(group, new THREE.SphereGeometry(0.105, 16, 12), joint, [knee.x, knee.y, knee.z]);
    add(group, new THREE.CylinderGeometry(0.088, 0.088, 0.05, 20), joint, [knee.x, knee.y, knee.z + 0.095], [Math.PI / 2, 0, 0]);
    ringPair(group, 0.07, 0.007, accent, [knee.x, knee.y, knee.z + 0.12], [0, 0, 0], 22);
    // shin
    add(group, new THREE.CapsuleGeometry(0.092, 0.22, 6, 14), shell, [ankle.x, 0.41, ankle.z]);
    add(group, roundedBox(0.17, 0.2, 0.13, 0.045, 3), shellDark, [ankle.x, 0.42, ankle.z + 0.085], [0.05, 0, 0]);
    // ankle + foot
    add(group, new THREE.SphereGeometry(0.078, 14, 12), joint, [ankle.x, ankle.y, ankle.z]);
    add(group, roundedBox(0.28, 0.13, 0.42, 0.05, 3), shell, [ankle.x, 0.095, 0.06]);
    add(group, roundedBox(0.24, 0.07, 0.2, 0.03, 2), panel, [ankle.x, 0.15, -0.02]);
    add(group, roundedBox(0.26, 0.045, 0.16, 0.022, 2), shellDark, [ankle.x, 0.04, 0.2], [0.16, 0, 0]);
    add(group, roundedBox(0.28, 0.026, 0.44, 0.012, 2), rubber, [ankle.x, 0.014, 0.06]);
  };

  // Pelvis + waist.
  add(group, roundedBox(0.56, 0.24, 0.4, 0.085, 3), shell, [0, 1.0, 0]);
  add(group, roundedBox(0.4, 0.1, 0.34, 0.035, 2), panel, [0, 1.03, 0.12]);
  add(group, new THREE.CylinderGeometry(0.135, 0.155, 0.16, 24), joint, [0, 1.15, 0]);
  ringPair(group, 0.142, 0.012, panel, [0, 1.2, 0], undefined, 30);
  mirrored(group, (side) => {
    add(group, new THREE.CapsuleGeometry(0.082, 0.08, 5, 12), joint, [side * 0.26, 0.97, 0.03], [0, 0, side * 0.25]);
    buildLeg(side);
  });

  // Torso: chamfered chest shell with a proud, single-layer chest plate.
  add(group, roundedBox(0.72, 0.54, 0.44, 0.13, 4), shell, [0, 1.62, 0]);
  add(group, roundedBox(0.5, 0.34, 0.14, 0.07, 3), panel, [0, 1.63, 0.2]);
  add(group, roundedBox(0.3, 0.09, 0.05, 0.026, 2), shellDark, [0, 1.7, 0.27]);
  add(group, roundedBox(0.14, 0.022, 0.016, 0.008, 1), accent, [-0.06, 1.7, 0.295]);
  // shoulder-to-chest seams sit on the shell, clear of the plate
  add(group, roundedBox(0.3, 0.01, 0.01, 0.003, 1), joint, [0, 1.45, 0.218]);
  // back pack + vents
  add(group, roundedBox(0.46, 0.42, 0.16, 0.055, 3), shellDark, [0, 1.62, -0.22]);
  for (let i = 0; i < 3; i += 1) {
    add(group, roundedBox(0.34, 0.02, 0.03, 0.008, 1), joint, [0, 1.74 - i * 0.08, -0.3]);
  }

  // Neck + collar.
  add(group, new THREE.CylinderGeometry(0.085, 0.11, 0.16, 18), joint, [0, 1.94, 0]);
  ringPair(group, 0.155, 0.028, shellDark, [0, 1.88, 0], undefined, 26);

  // Head: helmet shell, wraparound visor, ear pods, antenna.
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.14, 0);
  headGroup.rotation.set(-0.03, 0.16, 0);
  const helmet = add(headGroup, roundedBox(0.5, 0.42, 0.46, 0.12, 4), shell);
  helmet.scale.set(1, 1, 1);
  add(headGroup, roundedBox(0.44, 0.18, 0.06, 0.05, 3), visor, [0, 0.02, 0.23]);
  mirrored(headGroup, (side) => {
    add(headGroup, new THREE.SphereGeometry(0.045, 14, 12), eyeGlow, [side * 0.1, 0.03, 0.245], [0, 0, 0], [1.5, 0.72, 0.6]);
  });
  add(headGroup, roundedBox(0.3, 0.03, 0.04, 0.012, 2), panel, [0, 0.16, 0.22]);
  add(headGroup, roundedBox(0.36, 0.1, 0.06, 0.03, 2), shellDark, [0, -0.14, 0.19]);
  mirrored(headGroup, (side) => {
    // ear pods with accent rings
    add(headGroup, new THREE.CylinderGeometry(0.1, 0.1, 0.08, 24), shellDark, [side * 0.26, 0.0, 0], [0, 0, Math.PI / 2]);
    ringPair(headGroup, 0.085, 0.016, accent, [side * 0.3, 0.0, 0], [0, Math.PI / 2, 0], 26);
    add(headGroup, new THREE.CylinderGeometry(0.036, 0.036, 0.1, 14), joint, [side * 0.33, 0.0, 0], [0, 0, Math.PI / 2]);
    // cheek panels
    add(headGroup, roundedBox(0.03, 0.16, 0.2, 0.014, 2), panel, [side * 0.245, -0.08, 0.06]);
  });
  add(headGroup, new THREE.CylinderGeometry(0.02, 0.026, 0.18, 10), joint, [0, 0.28, -0.04]);
  add(headGroup, new THREE.SphereGeometry(0.042, 14, 12), eyeGlow, [0, 0.38, -0.04]);
  add(headGroup, new THREE.SphereGeometry(0.03, 12, 10), shellDark, [0, 0.38, -0.06]);
  group.add(headGroup);

  // Shoulders + arms in a relaxed, slightly asymmetric pose.
  const buildArm = (side: number, bend: number) => {
    const shoulder = V(side * 0.43, 1.76, 0);
    const elbow = V(side * (0.55 + bend * 0.02), 1.42, 0.06 + bend * 0.1);
    const wrist = V(side * (0.5 - bend * 0.05), 1.1, 0.1 + bend * 0.24);
    add(group, new THREE.SphereGeometry(0.13, 16, 14), joint, [shoulder.x, shoulder.y, shoulder.z]);
    add(group, roundedBox(0.26, 0.22, 0.3, 0.09, 3), shell, [shoulder.x + side * 0.02, shoulder.y + 0.04, 0], [0, 0, side * -0.16]);
    add(group, roundedBox(0.2, 0.12, 0.24, 0.05, 2), panel, [shoulder.x + side * 0.035, shoulder.y + 0.09, 0.03]);
    add(group, sweepGeometry(new THREE.CatmullRomCurve3([shoulder, elbow]), (t) => 0.085 - t * 0.012, 14, 12), shellDark);
    add(group, new THREE.SphereGeometry(0.09, 14, 12), joint, [elbow.x, elbow.y, elbow.z]);
    ringPair(group, 0.082, 0.012, accent, [elbow.x + side * 0.02, elbow.y, elbow.z], [0, Math.PI / 2, 0], 22);
    add(group, sweepGeometry(new THREE.CatmullRomCurve3([elbow, wrist]), (t) => 0.078 + t * 0.02, 14, 12), shell);
    add(group, roundedBox(0.17, 0.22, 0.17, 0.05, 3), panel, [wrist.x, wrist.y + 0.02, wrist.z + 0.02]);
    // hand
    add(group, roundedBox(0.13, 0.14, 0.16, 0.045, 3), shellDark, [wrist.x, wrist.y - 0.1, wrist.z + 0.02]);
    for (let finger = -1; finger <= 1; finger += 1) {
      add(group, new THREE.CapsuleGeometry(0.021, 0.07, 4, 8), joint, [wrist.x + finger * 0.04, wrist.y - 0.2, wrist.z + 0.03], [0.2, 0, 0]);
    }
    add(group, new THREE.CapsuleGeometry(0.021, 0.06, 4, 8), joint, [wrist.x + side * 0.07, wrist.y - 0.12, wrist.z + 0.06], [0, 0, side * 0.7]);
  };
  buildArm(-1, 0);
  buildArm(1, 1);

  return group;
}

/* -------------------------------------------------------------------------- */
/* Housekeeping                                                                */
/* -------------------------------------------------------------------------- */

export function disposeObject(root: THREE.Object3D) {
  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : [object.material];
      list.forEach((material) => materials.add(material));
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

export function createCollection() {
  return [createDragon(), createCar(), createVase(), createRobot()] as const;
}
