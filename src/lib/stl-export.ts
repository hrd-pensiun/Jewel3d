import { Mesh } from "three";
import type { BufferGeometry } from "three";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { getProxiedModelUrl } from "@/lib/model-url";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function exportGlbToStl(
  modelUrl: string,
  filename: string,
): Promise<void> {
  const loader = new GLTFLoader();
  const proxiedUrl = getProxiedModelUrl(modelUrl);
  const gltf = await loader.loadAsync(proxiedUrl);
  gltf.scene.updateMatrixWorld(true);

  const meshGeometries: BufferGeometry[] = [];

  gltf.scene.traverse((child) => {
    if (child instanceof Mesh && child.geometry) {
      const geometry = child.geometry.clone();
      geometry.applyMatrix4(child.matrixWorld);
      meshGeometries.push(geometry);
    }
  });

  if (meshGeometries.length === 0) {
    throw new Error("Tidak ada geometry mesh pada model GLB.");
  }

  const merged = mergeGeometries(meshGeometries, false);
  if (!merged) {
    throw new Error("Gagal menggabungkan geometry mesh.");
  }

  const exporter = new STLExporter();
  const stlData = exporter.parse(new Mesh(merged), { binary: true });
  const blob = new Blob([stlData], { type: "application/octet-stream" });

  triggerDownload(blob, filename);
}
