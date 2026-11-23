"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createCollection, disposeObject } from "@/components/hero/HeroModels";
import { heroCamera, stagePoses, stageStudies, type Pose } from "@/components/hero/stage";

type Props = { onReady: () => void; onSceneChange: (scene: number) => void };

/**
 * Studio staging for the VEXAUSE LABS hero.
 *
 * The canvas is transparent and framed to the hero section itself, so the
 * rendered products share the page background instead of sitting in a panel.
 * There is deliberately no ground plane, backdrop plane or haze card: those
 * were the surfaces that produced a visible rectangular edge where the scene
 * met the page. Grounding now comes from small, per-product contact shadows
 * that fade out well before the canvas boundary.
 *
 * Six objects are staged at three depths: one featured piece, two mid-ground
 * supports, one far support and two small background studies. Every object
 * carries its own float speed, phase and yaw speed, and the featured slot is
 * promoted on a slow timed cycle with a staggered, damped move.
 */

type Motion = { from: Pose; to: Pose; start: number; duration: number };
type Layer = "featured" | "mid" | "far";

const LAYERS: Layer[] = ["featured", "mid", "mid", "far"];

/** Independent ambient motion per staged object. */
const DRIFT = [
  { bob: 0.022, bobSpeed: 0.62, phase: 0.0, yaw: 0.22, yawSpeed: 0.22 },
  { bob: 0.014, bobSpeed: 0.78, phase: 1.7, yaw: 0.07, yawSpeed: 0.17 },
  { bob: 0.017, bobSpeed: 0.54, phase: 3.1, yaw: 0.09, yawSpeed: 0.13 },
  { bob: 0.02, bobSpeed: 0.7, phase: 4.6, yaw: 0.12, yawSpeed: 0.1 },
  { bob: 0.013, bobSpeed: 0.85, phase: 2.4, yaw: 0.16, yawSpeed: 0.19 },
  { bob: 0.011, bobSpeed: 0.66, phase: 5.3, yaw: 0.1, yawSpeed: 0.12 },
];

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

/** A tiny emissive studio used as the reflection environment (never rendered). */
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
        premultipliedAlpha: true,
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
    scene.background = null;
    const camera = new THREE.PerspectiveCamera(32, 1, 0.2, 80);
    const cameraTarget = new THREE.Vector3(-1.15, 0.82, 0);
    const cameraBase = new THREE.Vector3(0, 1.35, 6.2);
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const environment = studioEnvironment(renderer);
    scene.environment = environment;
    scene.environmentIntensity = 0.55;

    /* ----------------------------- lighting ----------------------------- */
    const key = new THREE.DirectionalLight(0xfff2dc, 2.7);
    key.position.set(-4.2, 6.4, 5.2);
    key.castShadow = true;
    const shadowSize = compact ? 1024 : 1536;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    key.shadow.camera.left = -6.4;
    key.shadow.camera.right = 6.4;
    key.shadow.camera.top = 6.2;
    key.shadow.camera.bottom = -3.6;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 26;
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

    /* ------------------------------ models ------------------------------ */
    // Four originals plus two depth duplicates (a vase study and a car study).
    // Duplicates share geometry and materials with their original, and are
    // skipped during disposal so shared buffers are only released once.
    const originals = createCollection();
    const vaseClone = originals[2].clone(true);
    const carClone = originals[1].clone(true);
    vaseClone.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
    carClone.traverse((object) => {
      if (object instanceof THREE.Mesh) object.castShadow = false;
    });
    const models = [...originals, vaseClone, carClone];
    const shared = new Set(originals);

    const shadowTexture = radialTexture([
      [0, "rgba(3,9,7,0.5)"],
      [0.45, "rgba(3,9,7,0.24)"],
      [0.78, "rgba(3,9,7,0.05)"],
      [1, "rgba(3,9,7,0)"],
    ], 256);

    const contactShadows = models.map((model) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0 }),
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.004;
      mesh.renderOrder = -1;
      scene.add(mesh);
      return mesh;
    });

    const motion: Pose[] = [];
    const poses: Motion[] = [];
    let currentScene = 0;

    // Narrow layouts put the stage in its own band under the copy, so the
    // collection is staged twice: a wide arc to the right of the type, and a
    // centred arrangement that fills the band. Track which one is live so a
    // rotation or window resize can re-stage smoothly.
    let stagingAspect = host.clientWidth / Math.max(1, host.clientHeight) || 1.895;
    const initial = stagePoses(0, stagingAspect);
    const initialStudies = stageStudies(stagingAspect);

    /** Point every model at the staging for the current scene and layout. */
    const retarget = (elapsed: number, smooth: boolean) => {
      const next = stagePoses(currentScene, stagingAspect);
      const studies = stageStudies(stagingAspect);
      for (let index = 0; index < models.length; index += 1) {
        const target = index < 4 ? next[index] : studies[index - 4];
        poses[index] = {
          from: smooth ? { ...motion[index] } : { ...target },
          to: { ...target },
          start: smooth ? elapsed + index * 0.09 : 0,
          duration: smooth ? 1.7 : 1,
        };
      }
    };

    models.forEach((model, index) => {
      const role = index < 4 ? LAYERS[index] : "far";
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = role !== "far";
        object.receiveShadow = role !== "far";
        if (object.geometry.boundingSphere === null) object.geometry.computeBoundingSphere();
        const radius = object.geometry.boundingSphere?.radius ?? 0.1;
        if (radius < 0.05) object.castShadow = false;
      });

      const target = index < 4 ? initial[index] : initialStudies[index - 4];
      const entry = { ...target, y: -0.5, scale: target.scale * 0.86, rotation: target.rotation - 0.3 };
      motion[index] = entry;
      poses[index] = { from: { ...entry }, to: { ...target }, start: 0.15 + index * 0.09, duration: 1.6 };
      scene.add(model);
    });

    /* ------------------------------ resize ------------------------------ */
    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.aspect = aspect;

      // Wide layouts hold the copy on the left, so the camera looks left of the
      // collection to push it into the right of frame. Narrow layouts centre it.
      const framing = heroCamera(aspect);
      camera.fov = framing.fov;
      cameraBase.set(...framing.position);
      cameraTarget.set(...framing.target);
      camera.position.copy(cameraBase);
      camera.updateProjectionMatrix();

      // Re-stage when the canvas changes shape: the arrangement is authored in
      // screen space, so an aspect change moves every slot.
      if (Math.abs(aspect - stagingAspect) > 0.06) {
        stagingAspect = aspect;
        retarget(performance.now() / 1000, !reducedMotion);
      }
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

      if (!reducedMotion && elapsed - lastSceneChange > 8 && elapsed > 3.5) {
        lastSceneChange = elapsed;
        currentScene = (currentScene + 1) % 4;
        callbacksRef.current.onSceneChange(currentScene);
        scenePulse = 1;
        retarget(elapsed, true);
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

        const drift = DRIFT[index];
        const phase = elapsed * drift.bobSpeed + drift.phase;
        const bob = reducedMotion ? 0 : Math.sin(phase) * drift.bob;
        const sway = reducedMotion ? 0 : Math.sin(elapsed * drift.yawSpeed + drift.phase) * drift.yaw;
        model.position.set(pose.x, pose.y + bob, pose.z);
        model.scale.setScalar(pose.scale);
        model.rotation.set(0, pose.rotation + sway, 0);

        const shadow = contactShadows[index];
        const radius = (index === 0 ? 1.45 : 1.1) * pose.scale;
        shadow.position.set(pose.x, 0.004, pose.z + 0.06);
        shadow.scale.set(radius, radius, 1);
        (shadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.55 - bob * 6) * (index < 4 ? 1 : 0.6);
      });

      // camera: slow orbit, damped pointer parallax, gentle dolly on scene change
      scenePulse = Math.max(0, scenePulse - 0.008);
      pointer.x += (pointer.targetX - pointer.x) * 0.045;
      pointer.y += (pointer.targetY - pointer.y) * 0.045;
      const orbit = reducedMotion ? 0 : Math.sin(elapsed * 0.1) * 0.14;
      const dolly = reducedMotion ? 0 : scenePulse * 0.5;
      camera.position.x = pointer.x * 0.34 + Math.sin(orbit) * cameraBase.z;
      camera.position.y = cameraBase.y - pointer.y * 0.24 + scenePulse * 0.07;
      camera.position.z = cameraBase.z + dolly + (1 - Math.cos(orbit)) * cameraBase.z * 0.5;
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
      shared.forEach((model) => disposeObject(model));
      contactShadows.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      shadowTexture?.dispose();
      environment.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="vx-hero__canvas" aria-hidden="true" />;
}
