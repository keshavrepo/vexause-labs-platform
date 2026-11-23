"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createCollection, disposeObject } from "@/components/hero/HeroModels";

type Props = { onReady: () => void; onSceneChange: (scene: number) => void };

/**
 * Studio staging for the VEXAUSE LABS hero.
 *
 * Composition: one featured product front-and-centre on a machined plinth,
 * two supporting pieces staged back-left and back-right at a consistent
 * collection scale, and the fourth waiting off-stage. Rotating the collection
 * promotes the next product with a damped, staggered move — no cuts, no bounce.
 */

type Pose = { x: number; y: number; z: number; scale: number; rotation: number };
type Motion = { from: Pose; to: Pose; start: number; duration: number };

/** Each product's featured scale, tuned so all four read at a similar presence. */
const FEATURED = [0.72, 0.78, 0.82, 0.84];
const SUPPORT = 0.56;

const stageLayout = (featured: number): Pose[] => {
  const poses: Pose[] = [];
  for (let slot = 0; slot < 4; slot += 1) {
    const index = (featured + slot) % 4;
    if (slot === 0) {
      poses[index] = { x: 0, y: 0, z: 0.35, scale: FEATURED[index], rotation: -0.28 };
    } else if (slot === 1) {
      poses[index] = { x: 2.28, y: 0, z: -2, scale: FEATURED[index] * SUPPORT, rotation: 0.5 };
    } else if (slot === 2) {
      poses[index] = { x: -2.28, y: 0, z: -2, scale: FEATURED[index] * SUPPORT, rotation: -0.52 };
    } else {
      poses[index] = { x: 0.2, y: -8, z: -13, scale: FEATURED[index] * 0.3, rotation: 0.1 };
    }
  }
  return poses;
};

function radialTexture(stops: Array<[number, string]>, size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** A tiny emissive studio used as the reflection environment. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x0c1a15);
  const panel = (color: number, intensity: number, width: number, height: number, position: [number, number, number], rotation: [number, number, number]) => {
    const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    material.color.multiplyScalar(intensity);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    env.add(mesh);
  };
  panel(0xfff4e2, 2.6, 5, 4, [-4, 5, 4], [0, -0.5, 0.35]);
  panel(0xcfe6ef, 1.3, 4.5, 6, [6, 2, 2], [0, 1.1, 0]);
  panel(0xdcefbc, 1.7, 5, 2.4, [0, 4.5, -5.5], [0.4, 0, 0]);
  panel(0x1c3529, 1.0, 12, 12, [0, -4, 0], [-Math.PI / 2, 0, 0]);

  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(env, 0.05, 0.1, 60);
  generator.dispose();
  env.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
  });
  return target.texture;
}

export default function HeroProductScene({ onReady, onSceneChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacksRef = useRef({ onReady, onSceneChange });
  callbacksRef.current = { onReady, onSceneChange };

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host || !window.WebGLRenderingContext) return;

    const compact = window.innerWidth < 760;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !compact || window.devicePixelRatio < 2,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
      });
    } catch (error) {
      console.warn("WebGL is unavailable; keeping the static product illustration.", error);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(compact ? 40 : 32, 1, 0.2, 60);
    const cameraTarget = new THREE.Vector3(0, 1.02, 0);
    const cameraBase = new THREE.Vector3(0, compact ? 2.05 : 1.95, compact ? 8.6 : 6.7);
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const environment = studioEnvironment(renderer);
    scene.environment = environment;
    scene.environmentIntensity = 0.55;

    /* ----------------------------- lighting ----------------------------- */
    const key = new THREE.DirectionalLight(0xfff2dc, 2.7);
    key.position.set(-4.2, 6.4, 5.2);
    key.castShadow = true;
    const shadowSize = compact ? 1024 : 2048;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    key.shadow.camera.left = -5.2;
    key.shadow.camera.right = 5.2;
    key.shadow.camera.top = 5.6;
    key.shadow.camera.bottom = -3.2;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 22;
    key.shadow.bias = -0.0006;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 4;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xc6e4ee, 0.85);
    fill.position.set(5.4, 2.6, 3.4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xd9f39a, 1.5);
    rim.position.set(2.2, 3.4, -6);
    scene.add(rim);

    scene.add(new THREE.HemisphereLight(0xdfeee3, 0x0d1712, 0.75));

    /* ----------------------------- staging ------------------------------ */
    // Ground: a soft disc that fades into the page instead of a hard plinth edge.
    const groundTexture = radialTexture([
      [0, "rgba(21,37,30,0.96)"],
      [0.55, "rgba(19,33,27,0.82)"],
      [0.82, "rgba(15,27,22,0.34)"],
      [1, "rgba(12,22,18,0)"],
    ], 512);
    if (groundTexture) {
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(3.25, 96),
        new THREE.MeshBasicMaterial({ map: groundTexture, transparent: true, depthWrite: false }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      scene.add(ground);
    }

    const contactTexture = radialTexture([
      [0, "rgba(0,0,0,0.55)"],
      [0.45, "rgba(0,0,0,0.22)"],
      [1, "rgba(0,0,0,0)"],
    ]);
    if (contactTexture) {
      const contact = new THREE.Mesh(
        new THREE.PlaneGeometry(4.4, 4.4),
        new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, opacity: 0.75, depthWrite: false }),
      );
      contact.rotation.x = -Math.PI / 2;
      contact.position.y = 0.016;
      scene.add(contact);
    }

    const hazeTexture = radialTexture([
      [0, "rgba(146,205,168,0.34)"],
      [0.5, "rgba(96,158,128,0.12)"],
      [1, "rgba(0,0,0,0)"],
    ]);
    if (hazeTexture) {
      const haze = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 9),
        new THREE.MeshBasicMaterial({ map: hazeTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      haze.position.set(0, 2.1, -7.2);
      scene.add(haze);
    }

    /* ------------------------------ models ------------------------------ */
    const models = createCollection();
    const poses: Motion[] = [];
    const motion = models.map(() => ({ x: 0, y: 0, z: 0, scale: 1, rotation: 0 }));
    let currentScene = 0;
    const initial = stageLayout(0);

    models.forEach((model, index) => {
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          // small details do not need to write to the shadow map
          const material = Array.isArray(object.material) ? object.material[0] : object.material;
          if (object.geometry.boundingSphere === null) object.geometry.computeBoundingSphere();
          const radius = object.geometry.boundingSphere?.radius ?? 0.1;
          if (radius < 0.045) object.castShadow = false;
        }
      });
      const target = initial[index];
      const entry = { ...target, y: -0.6, scale: target.scale * 0.82, rotation: target.rotation - 0.35 };
      motion[index] = entry;
      poses[index] = { from: { ...entry }, to: { ...target }, start: 0.15 + index * 0.1, duration: 1.5 };
      scene.add(model);
    });

    /* ------------------------------ resize ------------------------------ */
    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // pull the camera back on narrow canvases so nothing clips
      const compensation = camera.aspect < 1.15 ? 1 + (1.15 - camera.aspect) * 0.85 : 1;
      camera.position.set(cameraBase.x, cameraBase.y * compensation, cameraBase.z * compensation);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    /* --------------------------- interaction ---------------------------- */
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      pointer.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onPointerLeave = () => {
      pointer.targetX = 0;
      pointer.targetY = 0;
    };
    if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
      host.addEventListener("pointermove", onPointerMove);
      host.addEventListener("pointerleave", onPointerLeave);
    }

    let active = true;
    let inView = true;
    let lastSceneChange = 0;
    let scenePulse = 0;
    let visibilityObserver: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; });
      visibilityObserver.observe(host);
    }

    const easeInOut = (value: number) => (value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2);

    const renderFrame = (milliseconds: number) => {
      if (!active || !inView || document.hidden) return;
      const elapsed = milliseconds / 1000;

      if (!reducedMotion && elapsed - lastSceneChange > 7.2 && elapsed > 3) {
        lastSceneChange = elapsed;
        currentScene = (currentScene + 1) % 4;
        callbacksRef.current.onSceneChange(currentScene);
        scenePulse = 1;
        const layout = stageLayout(currentScene);
        models.forEach((model, index) => {
          poses[index] = {
            from: { ...motion[index] },
            to: { ...layout[index] },
            start: elapsed + index * 0.12,
            duration: 1.9,
          };
        });
      }

      models.forEach((model, index) => {
        const move = poses[index];
        const progress = reducedMotion ? 1 : THREE.MathUtils.clamp((elapsed - move.start) / move.duration, 0, 1);
        const eased = easeInOut(progress);
        const pose = motion[index];
        pose.x = THREE.MathUtils.lerp(move.from.x, move.to.x, eased);
        pose.y = THREE.MathUtils.lerp(move.from.y, move.to.y, eased);
        pose.z = THREE.MathUtils.lerp(move.from.z, move.to.z, eased);
        pose.scale = THREE.MathUtils.lerp(move.from.scale, move.to.scale, eased);
        pose.rotation = THREE.MathUtils.lerp(move.from.rotation, move.to.rotation, eased);

        model.position.set(pose.x, pose.y, pose.z);
        model.scale.setScalar(pose.scale);
        // featured pieces turn slowly; supporting pieces hold their angle
        const featuredNow = index === currentScene;
        const turn = reducedMotion ? 0 : featuredNow ? Math.sin(elapsed * 0.22) * 0.22 : 0;
        const bob = reducedMotion ? 0 : Math.sin(elapsed * 0.55 + index * 1.3) * (featuredNow ? 0.012 : 0.008);
        model.rotation.set(0, pose.rotation + turn, 0);
        model.position.y = pose.y + bob;
      });

      // camera: slow orbit, damped pointer parallax, gentle dolly on scene change
      scenePulse = Math.max(0, scenePulse - 0.008);
      pointer.x += (pointer.targetX - pointer.x) * 0.045;
      pointer.y += (pointer.targetY - pointer.y) * 0.045;
      const orbit = reducedMotion ? 0 : Math.sin(elapsed * 0.11) * 0.16;
      const dolly = reducedMotion ? 0 : scenePulse * 0.55;
      const compensation = camera.aspect < 1.15 ? 1 + (1.15 - camera.aspect) * 0.85 : 1;
      camera.position.x = pointer.x * 0.42 + Math.sin(orbit) * cameraBase.z;
      camera.position.y = cameraBase.y * compensation - pointer.y * 0.26 + scenePulse * 0.08;
      camera.position.z = cameraBase.z * compensation + dolly + (1 - Math.cos(orbit)) * cameraBase.z * 0.5;
      camera.lookAt(cameraTarget);

      renderer.render(scene, camera);
    };

    const handleVisibility = () => {
      if (document.hidden) renderer.setAnimationLoop(null);
      else renderer.setAnimationLoop(renderFrame);
    };

    renderFrame(0);
    callbacksRef.current.onReady();
    if (!reducedMotion) renderer.setAnimationLoop(renderFrame);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      active = false;
      renderer.setAnimationLoop(null);
      document.removeEventListener("visibilitychange", handleVisibility);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
      visibilityObserver?.disconnect();
      resizeObserver.disconnect();
      models.forEach((model) => disposeObject(model));
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      contactTexture?.dispose();
      groundTexture?.dispose();
      hazeTexture?.dispose();
      environment.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="vxl-showcase-canvas" aria-hidden="true" />;
}
