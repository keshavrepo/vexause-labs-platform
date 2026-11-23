"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Props = { onReady: () => void; onSceneChange: (scene: number) => void };
type Pose = { x: number; y: number; z: number; scale: number; rotation: number };
type Motion = { from: Pose; to: Pose; start: number };

const layouts: Pose[][] = [
  [
    { x: 0, y: 0.08, z: 0, scale: 1.04, rotation: -0.15 },
    { x: -2.35, y: -1.05, z: -1.4, scale: 0.34, rotation: 0.2 },
    { x: 2.45, y: -1.23, z: -1.5, scale: 0.37, rotation: -0.2 },
    { x: 2.2, y: 0.66, z: -1.7, scale: 0.34, rotation: 0.16 },
  ],
  [
    { x: -2.2, y: -0.12, z: -1.4, scale: 0.39, rotation: 0.2 },
    { x: 0, y: -0.67, z: 0, scale: 1.08, rotation: -0.16 },
    { x: 2.4, y: -1.2, z: -1.5, scale: 0.37, rotation: 0.1 },
    { x: 2.1, y: 0.7, z: -1.6, scale: 0.34, rotation: 0.2 },
  ],
  [
    { x: -2.25, y: -0.2, z: -1.4, scale: 0.38, rotation: -0.2 },
    { x: 2.25, y: -1.1, z: -1.5, scale: 0.39, rotation: 0.1 },
    { x: 0, y: -1.24, z: 0, scale: 1.02, rotation: 0.12 },
    { x: -2.25, y: 0.72, z: -1.7, scale: 0.36, rotation: -0.1 },
  ],
  [
    { x: 2.2, y: -0.16, z: -1.4, scale: 0.39, rotation: 0.18 },
    { x: -2.25, y: -1.12, z: -1.5, scale: 0.38, rotation: -0.1 },
    { x: -2.25, y: 0.73, z: -1.7, scale: 0.35, rotation: 0.12 },
    { x: 0, y: -1.23, z: 0, scale: 1.02, rotation: -0.12 },
  ],
];

const plastic = (color: number, roughness = 0.32) => new THREE.MeshPhysicalMaterial({
  color,
  roughness,
  metalness: 0.04,
  clearcoat: 0.42,
  clearcoatRoughness: 0.25,
});

function addMesh<T extends THREE.BufferGeometry>(
  parent: THREE.Object3D,
  geometry: T,
  material: THREE.Material,
  position: THREE.Vector3 | [number, number, number] = [0, 0, 0],
  scale?: [number, number, number],
) {
  const mesh = new THREE.Mesh(geometry, material);
  if (Array.isArray(position)) mesh.position.set(...position);
  else mesh.position.copy(position);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function tubeBetween(parent: THREE.Object3D, start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) {
  const curve = new THREE.LineCurve3(start, end);
  return addMesh(parent, new THREE.TubeGeometry(curve, 8, radius, 8, false), material);
}

function createDragon() {
  const group = new THREE.Group();
  const bodyMaterial = plastic(0x398d68, 0.28);
  const ridgeMaterial = plastic(0x9fe49b, 0.35);
  const darkMaterial = plastic(0x153f3d, 0.3);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.45, -0.72, 0),
    new THREE.Vector3(-1.82, -0.42, 0.06),
    new THREE.Vector3(-1.75, 0.28, 0.02),
    new THREE.Vector3(-1.25, 0.64, -0.02),
    new THREE.Vector3(-0.72, 0.12, 0.05),
    new THREE.Vector3(-0.2, -0.55, 0.02),
    new THREE.Vector3(0.56, -0.6, 0),
    new THREE.Vector3(1.25, -0.24, 0.04),
    new THREE.Vector3(1.36, 0.47, 0.06),
    new THREE.Vector3(0.85, 0.98, 0.1),
    new THREE.Vector3(0.22, 1.04, 0.08),
  ]);
  addMesh(group, new THREE.TubeGeometry(curve, 150, 0.2, 14, false), bodyMaterial);

  const ringCount = 34;
  for (let index = 2; index < ringCount; index += 1) {
    const t = index / ringCount;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const radius = 0.194 * (1 - t * 0.18);
    const ring = addMesh(group, new THREE.TorusGeometry(radius, 0.009, 4, 14), ridgeMaterial, point);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
  }

  for (let index = 0; index < 13; index += 1) {
    const t = 0.12 + index * 0.057;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const spike = addMesh(group, new THREE.ConeGeometry(0.085, 0.2, 5), ridgeMaterial, [point.x, point.y + 0.17, point.z]);
    spike.rotation.z = -tangent.x * 0.45;
  }

  const head = new THREE.Group();
  head.position.copy(curve.getPointAt(1));
  addMesh(head, new THREE.SphereGeometry(0.28, 20, 16), bodyMaterial, [0.02, 0.02, 0], [1.12, 0.83, 0.9]);
  addMesh(head, new THREE.SphereGeometry(0.18, 18, 12), ridgeMaterial, [0.27, -0.07, 0.01], [1.12, 0.55, 0.75]);
  addMesh(head, new THREE.ConeGeometry(0.075, 0.3, 7), ridgeMaterial, [-0.12, 0.26, 0.14]);
  addMesh(head, new THREE.ConeGeometry(0.075, 0.3, 7), ridgeMaterial, [-0.12, 0.26, -0.14]);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xe7ff87, emissive: 0x7d9d36, emissiveIntensity: 0.45, roughness: 0.22 });
  addMesh(head, new THREE.SphereGeometry(0.045, 12, 10), eyeMaterial, [0.08, 0.1, 0.22]);
  addMesh(head, new THREE.SphereGeometry(0.045, 12, 10), eyeMaterial, [0.08, 0.1, -0.22]);
  addMesh(head, new THREE.SphereGeometry(0.018, 8, 8), darkMaterial, [0.39, -0.02, 0.1]);
  group.add(head);

  const legPoints = [
    [new THREE.Vector3(-1.34, -0.02, 0), new THREE.Vector3(-1.1, -0.48, 0.2)],
    [new THREE.Vector3(-0.1, -0.5, 0), new THREE.Vector3(-0.28, -0.91, 0.22)],
    [new THREE.Vector3(0.83, -0.4, 0), new THREE.Vector3(1.02, -0.82, 0.2)],
  ];
  for (const [shoulder, foot] of legPoints) {
    tubeBetween(group, shoulder, foot, 0.085, bodyMaterial);
    addMesh(group, new THREE.SphereGeometry(0.1, 12, 10), ridgeMaterial, foot);
    for (let toe = -1; toe <= 1; toe += 1) {
      const start = foot.clone().add(new THREE.Vector3(0.02, -0.02, toe * 0.055));
      const end = start.clone().add(new THREE.Vector3(0.16, -0.025, toe * 0.045));
      tubeBetween(group, start, end, 0.022, ridgeMaterial);
    }
  }
  return group;
}

function createCar() {
  const group = new THREE.Group();
  const bodyMaterial = plastic(0xd66f4c, 0.25);
  const trimMaterial = plastic(0xffc98d, 0.3);
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x8bc4b2, roughness: 0.18, metalness: 0.08, clearcoat: 0.8, transparent: true, opacity: 0.9 });
  const shape = new THREE.Shape();
  shape.moveTo(-1.5, -0.28);
  shape.lineTo(-1.34, 0.02);
  shape.quadraticCurveTo(-1.27, 0.14, -1.08, 0.18);
  shape.lineTo(-0.65, 0.23);
  shape.lineTo(-0.22, 0.68);
  shape.quadraticCurveTo(-0.11, 0.78, 0.08, 0.78);
  shape.lineTo(0.63, 0.74);
  shape.quadraticCurveTo(0.8, 0.72, 0.91, 0.57);
  shape.lineTo(1.29, 0.21);
  shape.lineTo(1.48, 0.13);
  shape.lineTo(1.55, -0.2);
  shape.lineTo(1.4, -0.32);
  shape.lineTo(-1.5, -0.32);
  const bodyGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.82, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.055, bevelThickness: 0.045, curveSegments: 12 });
  bodyGeometry.translate(0, 0, -0.41);
  addMesh(group, bodyGeometry, bodyMaterial);

  const windowShape = new THREE.Shape();
  windowShape.moveTo(-0.52, 0.27);
  windowShape.lineTo(-0.15, 0.65);
  windowShape.lineTo(0.55, 0.63);
  windowShape.lineTo(0.91, 0.28);
  windowShape.closePath();
  const glassGeometry = new THREE.ExtrudeGeometry(windowShape, { depth: 0.62, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.025, bevelThickness: 0.025 });
  glassGeometry.translate(0, 0, -0.31);
  addMesh(group, glassGeometry, glassMaterial, [0, 0.015, 0]);

  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x171d1c, roughness: 0.78 });
  const hubMaterial = plastic(0xb9c59e, 0.3);
  for (const x of [-0.9, 0.95]) {
    for (const z of [-0.43, 0.43]) {
      const wheel = addMesh(group, new THREE.CylinderGeometry(0.31, 0.31, 0.17, 24), tireMaterial, [x, -0.25, z]);
      wheel.rotation.x = Math.PI / 2;
      const hub = addMesh(group, new THREE.CylinderGeometry(0.17, 0.17, 0.185, 20), hubMaterial, [x, -0.25, z]);
      hub.rotation.x = Math.PI / 2;
      addMesh(group, new THREE.TorusGeometry(0.22, 0.018, 5, 24), trimMaterial, [x, -0.25, z]);
    }
  }

  const lineMaterial = plastic(0xffdba8, 0.38);
  for (const z of [-0.423, 0.423]) {
    for (const y of [-0.12, -0.025]) {
      const line = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.3, y, z),
        new THREE.Vector3(-0.75, y + 0.015, z),
        new THREE.Vector3(0, y + 0.02, z),
        new THREE.Vector3(0.75, y + 0.015, z),
        new THREE.Vector3(1.4, y, z),
      ]);
      addMesh(group, new THREE.TubeGeometry(line, 38, 0.008, 5, false), lineMaterial);
    }
  }
  addMesh(group, new THREE.SphereGeometry(0.08, 12, 10), trimMaterial, [1.43, -0.02, 0.3], [1, 0.6, 0.55]);
  addMesh(group, new THREE.SphereGeometry(0.08, 12, 10), trimMaterial, [1.43, -0.02, -0.3], [1, 0.6, 0.55]);
  return group;
}

function createVase() {
  const group = new THREE.Group();
  const points = [
    new THREE.Vector2(0, 0), new THREE.Vector2(0.43, 0), new THREE.Vector2(0.59, 0.14),
    new THREE.Vector2(0.67, 0.42), new THREE.Vector2(0.53, 0.72), new THREE.Vector2(0.39, 1.15),
    new THREE.Vector2(0.4, 1.65), new THREE.Vector2(0.53, 2.08), new THREE.Vector2(0.67, 2.44),
    new THREE.Vector2(0.63, 2.61), new THREE.Vector2(0.48, 2.61), new THREE.Vector2(0.46, 2.44),
    new THREE.Vector2(0.48, 2.12), new THREE.Vector2(0.36, 1.65), new THREE.Vector2(0.35, 1.18),
    new THREE.Vector2(0.48, 0.75), new THREE.Vector2(0.55, 0.44), new THREE.Vector2(0.46, 0.22),
    new THREE.Vector2(0.29, 0.18), new THREE.Vector2(0, 0.18),
  ];
  const bodyMaterial = plastic(0xa65262, 0.24);
  addMesh(group, new THREE.LatheGeometry(points, 72), bodyMaterial);
  const vaseRim = addMesh(group, new THREE.TorusGeometry(0.56, 0.055, 8, 48), plastic(0xe4a087, 0.27), [0, 2.59, 0]);
  vaseRim.rotation.x = Math.PI / 2;
  const ribMaterial = plastic(0xe09b84, 0.32);
  const radiusAt = (height: number) => {
    const profile = [[0.08, 0.45], [0.18, 0.55], [0.42, 0.66], [0.72, 0.52], [1.15, 0.39], [1.65, 0.4], [2.08, 0.53], [2.44, 0.67], [2.55, 0.65]];
    for (let index = 1; index < profile.length; index += 1) {
      const previous = profile[index - 1];
      const current = profile[index];
      if (height <= current[0]) {
        const ratio = (height - previous[0]) / (current[0] - previous[0]);
        return previous[1] + (current[1] - previous[1]) * ratio;
      }
    }
    return 0.63;
  };
  const ribCount = 36;
  for (let rib = 0; rib < ribCount; rib += 1) {
    const angle = (rib / ribCount) * Math.PI * 2;
    const samples: THREE.Vector3[] = [];
    for (let step = 0; step <= 42; step += 1) {
      const height = 0.12 + (step / 42) * 2.38;
      const radius = radiusAt(height) + 0.012;
      samples.push(new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(samples);
    addMesh(group, new THREE.TubeGeometry(curve, 42, 0.009, 4, false), ribMaterial);
  }
  return group;
}

function createRobot() {
  const group = new THREE.Group();
  const teal = plastic(0x39889a, 0.28);
  const brightTeal = plastic(0x86d4c3, 0.32);
  const coral = plastic(0xe69464, 0.3);
  const dark = new THREE.MeshStandardMaterial({ color: 0x122b35, roughness: 0.25 });
  const eye = new THREE.MeshStandardMaterial({ color: 0xe8ff91, emissive: 0x76993d, emissiveIntensity: 0.42, roughness: 0.2 });

  const head = addMesh(group, new THREE.BoxGeometry(0.88, 0.68, 0.68), brightTeal, [0, 1.87, 0]);
  head.geometry.computeVertexNormals();
  addMesh(group, new THREE.BoxGeometry(0.68, 0.34, 0.06), dark, [0, 1.9, 0.36]);
  addMesh(group, new THREE.SphereGeometry(0.065, 12, 10), eye, [-0.17, 1.95, 0.41]);
  addMesh(group, new THREE.SphereGeometry(0.065, 12, 10), eye, [0.17, 1.95, 0.41]);
  addMesh(group, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, 1.77, 0.42), new THREE.Vector3(0, 1.73, 0.45), new THREE.Vector3(0.12, 1.77, 0.42),
  ]), 12, 0.018, 5, false), brightTeal);
  tubeBetween(group, new THREE.Vector3(0, 2.2, 0), new THREE.Vector3(0, 2.46, 0), 0.035, teal);
  addMesh(group, new THREE.SphereGeometry(0.075, 12, 10), eye, [0, 2.5, 0]);

  addMesh(group, new THREE.BoxGeometry(1.02, 0.96, 0.72), teal, [0, 0.93, 0]);
  addMesh(group, new THREE.BoxGeometry(0.5, 0.38, 0.08), coral, [0, 1.03, 0.39]);
  addMesh(group, new THREE.SphereGeometry(0.07, 12, 10), eye, [-0.12, 1.05, 0.45]);
  addMesh(group, new THREE.SphereGeometry(0.07, 12, 10), coral, [0.12, 1.05, 0.45]);
  const layerMaterial = plastic(0xa2e5d6, 0.4);
  for (const y of [0.57, 0.66, 0.75, 0.84, 1.27, 1.36]) {
    const line = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.45, y, 0.37), new THREE.Vector3(0, y - 0.015, 0.4), new THREE.Vector3(0.45, y, 0.37),
    ]);
    addMesh(group, new THREE.TubeGeometry(line, 20, 0.009, 4, false), layerMaterial);
  }

  for (const side of [-1, 1]) {
    const shoulder = new THREE.Vector3(side * 0.62, 1.25, 0);
    const elbow = new THREE.Vector3(side * 0.82, 0.86, 0.04);
    const hand = new THREE.Vector3(side * 0.79, 0.43, 0.05);
    tubeBetween(group, shoulder, elbow, 0.14, brightTeal);
    addMesh(group, new THREE.SphereGeometry(0.16, 14, 12), coral, elbow);
    tubeBetween(group, elbow, hand, 0.12, teal);
    addMesh(group, new THREE.SphereGeometry(0.16, 14, 12), brightTeal, hand);
    tubeBetween(group, new THREE.Vector3(side * 0.28, 0.48, 0), new THREE.Vector3(side * 0.28, 0.08, 0), 0.17, teal);
    addMesh(group, new THREE.BoxGeometry(0.48, 0.18, 0.48), brightTeal, [side * 0.28, 0.02, 0.04]);
  }
  return group;
}

function setShadows(root: THREE.Object3D) {
  root.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

function disposeScene(scene: THREE.Scene) {
  scene.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material.dispose());
    }
  });
}

export default function HeroProductScene({ onReady, onSceneChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacksRef = useRef({ onReady, onSceneChange });
  callbacksRef.current = { onReady, onSceneChange };

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host || !window.WebGLRenderingContext) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: window.innerWidth > 700 && window.devicePixelRatio < 2,
        powerPreference: "low-power",
      });
    } catch (error) {
      console.warn("WebGL is unavailable; using the static product illustration.", error);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
    camera.position.set(0, 0.72, 8.6);
    camera.lookAt(0, 0.05, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene.add(new THREE.HemisphereLight(0xdfffe7, 0x13221c, 2.15));
    const keyLight = new THREE.DirectionalLight(0xfff0d7, 3.1);
    keyLight.position.set(-3.6, 6, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(window.innerWidth < 700 ? 512 : 1024, window.innerWidth < 700 ? 512 : 1024);
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0003;
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xc8f36a, 14, 9);
    rimLight.position.set(3.4, 2.6, -1.8);
    scene.add(rimLight);
    const fillLight = new THREE.PointLight(0x92d9ff, 8, 8);
    fillLight.position.set(-3.2, 1.5, 3.7);
    scene.add(fillLight);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(3.18, 3.35, 0.17, 64),
      new THREE.MeshStandardMaterial({ color: 0x1d3028, roughness: 0.36, metalness: 0.14 }),
    );
    platform.position.y = -1.53;
    platform.receiveShadow = true;
    scene.add(platform);
    const platformEdge = new THREE.Mesh(
      new THREE.TorusGeometry(3.2, 0.018, 6, 96),
      new THREE.MeshBasicMaterial({ color: 0x9bbc7c, transparent: true, opacity: 0.8 }),
    );
    platformEdge.rotation.x = Math.PI / 2;
    platformEdge.position.y = -1.43;
    scene.add(platformEdge);
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.28 }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.44;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const models = [createDragon(), createCar(), createVase(), createRobot()];
    const poses: Motion[] = [];
    models.forEach((model, index) => {
      setShadows(model);
      const initial = layouts[0][index];
      model.position.set(initial.x + (index % 2 === 0 ? -2.5 : 2.5), initial.y + 1.3, initial.z - 1.5);
      model.scale.setScalar(0.12);
      model.rotation.y = initial.rotation + (index % 2 === 0 ? -0.8 : 0.8);
      scene.add(model);
      poses.push({
        from: { x: model.position.x, y: model.position.y, z: model.position.z, scale: 0.12, rotation: model.rotation.y },
        to: initial,
        start: 0.25 + index * 0.16,
      });
    });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let active = true;
    let inView = true;
    let currentScene = 0;
    let lastSceneChange = 0;
    let visibilityObserver: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
      visibilityObserver.observe(host);
    }

    const renderFrame = (milliseconds: number) => {
      if (!active || !inView || document.hidden) return;
      const elapsed = milliseconds / 1000;
      if (!reducedMotion && elapsed - lastSceneChange > 6.4) {
        lastSceneChange = elapsed;
        currentScene = (currentScene + 1) % layouts.length;
        callbacksRef.current.onSceneChange(currentScene);
        models.forEach((model, index) => {
          const current: Pose = {
            x: model.position.x,
            y: model.position.y,
            z: model.position.z,
            scale: model.scale.x,
            rotation: model.rotation.y,
          };
          poses[index] = {
            from: current,
            to: layouts[currentScene][index],
            start: elapsed + index * 0.13,
          };
        });
      }

      models.forEach((model, index) => {
        const motion = poses[index];
        const progress = reducedMotion ? 1 : Math.max(0, Math.min(1, (elapsed - motion.start) / 1.25));
        const eased = 1 - Math.pow(1 - progress, 3);
        model.position.set(
          THREE.MathUtils.lerp(motion.from.x, motion.to.x, eased),
          THREE.MathUtils.lerp(motion.from.y, motion.to.y, eased),
          THREE.MathUtils.lerp(motion.from.z, motion.to.z, eased),
        );
        model.scale.setScalar(THREE.MathUtils.lerp(motion.from.scale, motion.to.scale, eased));
        const drift = reducedMotion ? 0 : Math.sin(elapsed * 0.55 + index * 1.7) * 0.065;
        const slowTurn = reducedMotion ? 0 : elapsed * 0.065;
        model.rotation.y = THREE.MathUtils.lerp(motion.from.rotation, motion.to.rotation, eased) + drift + slowTurn;
        model.rotation.x = reducedMotion ? 0 : Math.sin(elapsed * 0.42 + index) * 0.025;
      });
      renderer.render(scene, camera);
    };

    const handleVisibility = () => {
      if (document.hidden) renderer.setAnimationLoop(null);
      else if (!reducedMotion) renderer.setAnimationLoop(renderFrame);
      else renderFrame(0);
    };

    renderFrame(0);
    callbacksRef.current.onReady();
    if (!reducedMotion) renderer.setAnimationLoop(renderFrame);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      renderer.setAnimationLoop(null);
      document.removeEventListener("visibilitychange", handleVisibility);
      visibilityObserver?.disconnect();
      resizeObserver.disconnect();
      disposeScene(scene);
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="vxl-showcase-canvas" aria-hidden="true"/>;
}
