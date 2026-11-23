/**
 * Hero model QA — offline CPU rasteriser.
 *
 * There is no browser in this environment, so the WebGL scene itself cannot be
 * screenshotted here. This script compiles the original model module with the
 * project's own TypeScript, verifies geometry integrity (finite vertices,
 * bounds, triangle budget) and renders true CPU previews of the actual meshes
 * to PNG so the silhouettes, proportions and composition can be inspected.
 *
 * It is a geometry/lighting preview, not a substitute for WebGL material QA.
 *
 *   node scripts/preview-hero-models.mjs
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".qa");
const buildDir = path.join(outDir, "hero-build");
const shotDir = path.join(outDir, "previews");

rmSync(buildDir, { recursive: true, force: true });
mkdirSync(buildDir, { recursive: true });
mkdirSync(shotDir, { recursive: true });
writeFileSync(path.join(outDir, "package.json"), JSON.stringify({ type: "module" }));

execFileSync(
  path.join(root, "node_modules/.bin/tsc"),
  [
    "components/hero/HeroModels.ts",
    "components/hero/stage.ts",
    "--outDir", buildDir,
    "--module", "es2020",
    "--target", "es2020",
    "--moduleResolution", "bundler",
    "--skipLibCheck",
    "--esModuleInterop",
  ],
  { stdio: "inherit" },
);

const THREE = await import("three");
const models = await import(path.join(buildDir, "HeroModels.js"));
const stage = await import(path.join(buildDir, "stage.js"));

/* ------------------------------ PNG writer ------------------------------ */

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function writePng(file, width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 3 + 1)] = 0;
    rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]));
}

/* ------------------------------ rasteriser ------------------------------ */

const LIGHTS = [
  { dir: new THREE.Vector3(-0.55, 0.85, 0.6).normalize(), color: [1.0, 0.96, 0.87], intensity: 1.05 },
  { dir: new THREE.Vector3(0.75, 0.25, 0.35).normalize(), color: [0.72, 0.9, 0.98], intensity: 0.34 },
  { dir: new THREE.Vector3(0.05, 0.35, -0.95).normalize(), color: [0.78, 0.95, 0.55], intensity: 0.42 },
];

function render(objects, { width = 900, height = 760, background = [0.055, 0.085, 0.075], cameraPos, target, fov = 34 }) {
  const ss = 2;
  const W = width * ss;
  const H = height * ss;
  const color = new Float32Array(W * H * 3);
  const depth = new Float32Array(W * H).fill(Infinity);

  // vertical studio gradient
  for (let y = 0; y < H; y += 1) {
    const t = y / (H - 1);
    const glow = Math.pow(1 - t, 2.4);
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 3;
      color[i] = background[0] + glow * 0.09 + 0.012;
      color[i + 1] = background[1] + glow * 0.105 + 0.014;
      color[i + 2] = background[2] + glow * 0.075 + 0.01;
    }
  }

  const camera = new THREE.PerspectiveCamera(fov, W / H, 0.05, 80);
  camera.position.copy(cameraPos);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const view = camera.matrixWorldInverse;

  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const n = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const p = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  let triangles = 0;

  for (const object of objects) {
    object.updateMatrixWorld(true);
    object.traverse((node) => {
      if (!node.isMesh) return;
      const geometry = node.geometry;
      const position = geometry.getAttribute("position");
      if (!position) return;
      const normalAttr = geometry.getAttribute("normal");
      const index = geometry.getIndex();
      const count = index ? index.count : position.count;
      const material = Array.isArray(node.material) ? node.material[0] : node.material;
      const base = material.color ? material.color : new THREE.Color(0x888888);
      const emissive = material.emissive ? material.emissive : new THREE.Color(0x000000);
      const emissiveStrength = material.emissiveIntensity ?? 1;
      const rough = material.roughness ?? 0.6;
      const metal = material.metalness ?? 0;

      for (let tri = 0; tri < count; tri += 3) {
        const ia = index ? index.getX(tri) : tri;
        const ib = index ? index.getX(tri + 1) : tri + 1;
        const ic = index ? index.getX(tri + 2) : tri + 2;
        triangles += 1;
        for (let k = 0; k < 3; k += 1) {
          const idx = [ia, ib, ic][k];
          v[k].fromBufferAttribute(position, idx).applyMatrix4(node.matrixWorld);
          if (normalAttr) {
            n[k].fromBufferAttribute(normalAttr, idx);
          } else {
            n[k].set(0, 1, 0);
          }
          n[k].transformDirection(node.matrixWorld);
          p[k].copy(v[k]).project(camera);
          if (!Number.isFinite(p[k].x) || !Number.isFinite(p[k].y)) break;
        }
        const sx = p.map((pt) => (pt.x * 0.5 + 0.5) * W);
        const sy = p.map((pt) => (-pt.y * 0.5 + 0.5) * H);
        const sz = v.map((pt) => -pt.clone().applyMatrix4(view).z);
        if (sz.some((z) => !Number.isFinite(z) || z < 0.05)) continue;

        const minX = Math.max(0, Math.floor(Math.min(...sx)));
        const maxX = Math.min(W - 1, Math.ceil(Math.max(...sx)));
        const minY = Math.max(0, Math.floor(Math.min(...sy)));
        const maxY = Math.min(H - 1, Math.ceil(Math.max(...sy)));
        if (maxX < minX || maxY < minY) continue;

        const area = (sx[1] - sx[0]) * (sy[2] - sy[0]) - (sx[2] - sx[0]) * (sy[1] - sy[0]);
        if (Math.abs(area) < 1e-7) continue;

        // face normal from geometry for a stable, cull-free shading term
        const faceNormal = new THREE.Vector3()
          .subVectors(v[1], v[0])
          .cross(new THREE.Vector3().subVectors(v[2], v[0]))
          .normalize();
        if (!Number.isFinite(faceNormal.x)) continue;

        for (let y = minY; y <= maxY; y += 1) {
          for (let x = minX; x <= maxX; x += 1) {
            const px = x + 0.5;
            const py = y + 0.5;
            const w0 = ((sx[1] - px) * (sy[2] - py) - (sx[2] - px) * (sy[1] - py)) / area;
            const w1 = ((sx[2] - px) * (sy[0] - py) - (sx[0] - px) * (sy[2] - py)) / area;
            const w2 = 1 - w0 - w1;
            if (w0 < 0 || w1 < 0 || w2 < 0) continue;
            const z = w0 * sz[0] + w1 * sz[1] + w2 * sz[2];
            const di = y * W + x;
            if (z >= depth[di]) continue;
            depth[di] = z;

            let nx = w0 * n[0].x + w1 * n[1].x + w2 * n[2].x;
            let ny = w0 * n[0].y + w1 * n[1].y + w2 * n[2].y;
            let nz = w0 * n[0].z + w1 * n[1].z + w2 * n[2].z;
            const len = Math.hypot(nx, ny, nz) || 1;
            nx /= len; ny /= len; nz /= len;

            const shade = [0.15, 0.185, 0.175];
            let specular = 0;
            for (const light of LIGHTS) {
              const lambert = Math.max(0, nx * light.dir.x + ny * light.dir.y + nz * light.dir.z);
              for (let c = 0; c < 3; c += 1) shade[c] += lambert * light.intensity * light.color[c];
              specular += Math.pow(lambert, 20 + (1 - rough) * 130) * (0.07 + metal * 0.8) * light.intensity;
            }
            // soft upward bounce keeps undersides readable
            const bounce = Math.max(0, -ny) * 0.1;
            const ao = 0.74 + 0.26 * Math.min(1, Math.max(0, nz));
            const ci = di * 3;
            const baseChannels = [base.r, base.g, base.b];
            const emissiveChannels = [emissive.r, emissive.g, emissive.b];
            for (let c = 0; c < 3; c += 1) {
              const b = baseChannels[c];
              const value = (b * (shade[c] + bounce) + specular * (0.5 + b * 0.6)) * ao
                + emissiveChannels[c] * emissiveStrength * 0.45;
              color[ci + c] = value;
            }
          }
        }
      }
    });
  }

  // downsample + tone map + sRGB
  const out = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      for (let c = 0; c < 3; c += 1) {
        let sum = 0;
        for (let dy = 0; dy < ss; dy += 1) {
          for (let dx = 0; dx < ss; dx += 1) {
            sum += color[((y * ss + dy) * W + (x * ss + dx)) * 3 + c];
          }
        }
        let value = sum / (ss * ss);
        value = (value * (2.51 * value + 0.03)) / (value * (2.43 * value + 0.59) + 0.14); // ACES-ish
        value = Math.pow(Math.min(1, Math.max(0, value)), 1 / 2.2);
        out[(y * width + x) * 3 + c] = Math.round(value * 255);
      }
    }
  }
  return { png: out, triangles };
}

/* ------------------------------ integrity ------------------------------ */

function inspect(name, object) {
  let vertices = 0;
  let triangles = 0;
  let meshes = 0;
  const bad = [];
  object.updateMatrixWorld(true);
  object.traverse((node) => {
    if (!node.isMesh) return;
    meshes += 1;
    const geometry = node.geometry;
    const position = geometry.getAttribute("position");
    if (!position) return;
    vertices += position.count;
    triangles += (geometry.getIndex()?.count ?? position.count) / 3;
    for (let i = 0; i < position.count; i += 1) {
      if (!Number.isFinite(position.getX(i)) || !Number.isFinite(position.getY(i)) || !Number.isFinite(position.getZ(i))) {
        bad.push(node.name || geometry.type);
        break;
      }
    }
  });
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  return { name, meshes, vertices, triangles: Math.round(triangles), bad, min: box.min.toArray().map((n) => +n.toFixed(2)), max: box.max.toArray().map((n) => +n.toFixed(2)), size: size.toArray().map((n) => +n.toFixed(2)) };
}

const dragon = models.createDragon();
const car = models.createCar();
const vase = models.createVase();
const robot = models.createRobot();

const results = [inspect("dragon", dragon), inspect("car", car), inspect("vase", vase), inspect("robot", robot)];
console.table(results.map(({ name, meshes, vertices, triangles, min, max, size, bad }) => ({ name, meshes, vertices, triangles, size: size.join(" × "), min: min.join(","), max: max.join(","), nonFinite: bad.length })));

const shots = [
  { file: "01-dragon.png", objects: [dragon], cameraPos: new THREE.Vector3(3.4, 2.3, 5.2), target: new THREE.Vector3(0.1, 1.2, 0), fov: 36 },
  { file: "02-dragon-side.png", objects: [dragon], cameraPos: new THREE.Vector3(0.2, 1.9, 6.4), target: new THREE.Vector3(0.05, 1.15, 0), fov: 36 },
  { file: "03-car.png", objects: [car], cameraPos: new THREE.Vector3(4.1, 2.5, 4.6), target: new THREE.Vector3(0, 0.65, 0), fov: 30 },
  { file: "04-vase.png", objects: [vase], cameraPos: new THREE.Vector3(1.9, 2.4, 3.6), target: new THREE.Vector3(0, 1.3, 0), fov: 32 },
  { file: "05-robot.png", objects: [robot], cameraPos: new THREE.Vector3(2.2, 2.1, 3.9), target: new THREE.Vector3(0, 1.25, 0), fov: 33 },
];

for (const shot of shots) {
  const started = Date.now();
  const { png, triangles } = render(shot.objects, { cameraPos: shot.cameraPos, target: shot.target, fov: shot.fov, width: 760, height: 640 });
  writePng(path.join(shotDir, shot.file), 760, 640, png);
  console.log(`rendered ${shot.file} · ${triangles} triangles · ${Date.now() - started}ms`);
}

const collection = [dragon, car, vase, robot];

/* Composition and framing come from components/hero/stage.ts — the same module
 * the WebGL scene imports — so these previews cannot drift from what ships. */
const heroBackground = [0x0b / 255, 0x14 / 255, 0x11 / 255];

function stageScene(featured, width, height) {
  const aspect = width / height;
  const framing = stage.heroCamera(aspect);
  const poses = stage.stagePoses(featured, aspect);
  const studies = stage.stageStudies(aspect);
  const objects = [];

  collection.forEach((model, index) => {
    const pose = poses[index];
    model.position.set(pose.x, pose.y, pose.z);
    model.scale.setScalar(pose.scale);
    model.rotation.set(0, pose.rotation, 0);
    objects.push(model);
  });

  studies.forEach((study, index) => {
    const clone = collection[study.model].clone(true);
    clone.name = `study-${index}`;
    clone.position.set(study.x, study.y, study.z);
    clone.scale.setScalar(study.scale);
    clone.rotation.set(0, study.rotation, 0);
    objects.push(clone);
  });

  /* Report the projected footprint of every object so the staging numbers can
   * be checked against the frame instead of guessed. */
  const camera = new THREE.PerspectiveCamera(framing.fov, aspect, 0.1, 200);
  camera.position.set(...framing.position);
  camera.lookAt(new THREE.Vector3(...framing.target));
  camera.updateMatrixWorld(true);
  camera.updateProjectionMatrix();
  const report = objects.map((object) => {
    object.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(object);
    let minX = 1,
      maxX = 0,
      minY = 1,
      maxY = 0;
    for (let i = 0; i < 8; i += 1) {
      const v = new THREE.Vector3(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z,
      ).project(camera);
      minX = Math.min(minX, (v.x + 1) / 2);
      maxX = Math.max(maxX, (v.x + 1) / 2);
      minY = Math.min(minY, (1 - v.y) / 2);
      maxY = Math.max(maxY, (1 - v.y) / 2);
    }
    return { name: object.name || "object", minX, maxX, minY, maxY };
  });

  return {
    report,
    objects,
    options: {
      cameraPos: new THREE.Vector3(...framing.position),
      target: new THREE.Vector3(...framing.target),
      fov: framing.fov,
      width,
      height,
      background: heroBackground,
    },
  };
}

for (const [file, featured, width, height] of [
  ["00-stage-wide.png", 0, 1440, 760],
  ["00-stage-vase.png", 2, 1440, 760],
  ["00-stage-tablet.png", 0, 1024, 700],
  ["00-stage-narrow.png", 0, 390, 430],
]) {
  const scene = stageScene(featured, width, height);
  const started = Date.now();
  const { png, triangles } = render(scene.objects, scene.options);
  for (const item of scene.report) {
    console.log(
      `  ${item.name.padEnd(10)} x ${item.minX.toFixed(2)}–${item.maxX.toFixed(2)}  y ${item.minY.toFixed(2)}–${item.maxY.toFixed(2)}`,
    );
  }
  writePng(path.join(shotDir, file), width, height, png);
  console.log(`rendered ${file} · ${width}×${height} · ${triangles} triangles · ${Date.now() - started}ms`);
}

console.log(`\nPreviews written to ${path.relative(root, shotDir)}/`);
