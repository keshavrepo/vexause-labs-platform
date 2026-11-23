import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const root = path.resolve(process.env.PRIVATE_UPLOAD_DIR || "/var/lib/vexause/private-uploads");
export async function storePrivateUpload(file: File, namespace: string) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const key = `${namespace}/${randomBytes(24).toString("hex")}`;
  const destination = path.join(root, key);
  await mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
  await writeFile(destination, bytes, { flag: "wx", mode: 0o600 });
  return { storageKey: key, sizeBytes: bytes.byteLength };
}
export async function readPrivateUpload(storageKey: string) {
  if (!/^[a-z0-9-]+\/[a-f0-9]{48}$/.test(storageKey)) throw new Error("Invalid storage key");
  const target = path.resolve(root, storageKey);
  if (!target.startsWith(root + path.sep)) throw new Error("Invalid storage path");
  return readFile(target);
}
export function privateUploadMimeAllowed(mime: string, purpose: string) {
  if (purpose === "MODEL") return ["model/stl", "application/sla", "application/vnd.ms-pki.stl", "model/obj", "text/plain", "application/octet-stream", "model/3mf", "application/vnd.ms-3mfdocument"].includes(mime);
  return ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(mime);
}
