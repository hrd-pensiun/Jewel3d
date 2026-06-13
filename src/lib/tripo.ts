export const TRIPO_ENDPOINT = "tripo3d/tripo/v2.5/image-to-3d";

export type ModelFormat = "glb" | "fbx" | "unknown";

export type TripoGenerateResult = {
  taskId: string;
  modelUrl: string;
  previewUrl: string | null;
  format: ModelFormat;
};

export function detectModelFormat(modelUrl: string): ModelFormat {
  const lower = modelUrl.toLowerCase();
  if (lower.includes(".fbx")) return "fbx";
  if (lower.includes(".glb") || lower.includes(".gltf")) return "glb";
  return "unknown";
}

export function parseTripoOutput(data: {
  task_id?: string;
  model_mesh?: { url?: string };
  rendered_image?: { url?: string };
}): TripoGenerateResult | null {
  const modelUrl = data.model_mesh?.url;
  if (!modelUrl || !data.task_id) return null;

  return {
    taskId: data.task_id,
    modelUrl,
    previewUrl: data.rendered_image?.url ?? null,
    format: detectModelFormat(modelUrl),
  };
}
