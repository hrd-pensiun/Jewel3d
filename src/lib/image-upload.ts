const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function inferImageMimeType(file: File): string | null {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension) return null;

  return EXTENSION_TO_MIME[extension] ?? null;
}

export function isAllowedImage(file: File): boolean {
  return inferImageMimeType(file) !== null;
}

export function isHeicImage(file: File): boolean {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    extension === "heic" ||
    extension === "heif"
  );
}

export async function toUploadBlob(file: File): Promise<Blob> {
  const mimeType = inferImageMimeType(file) ?? "application/octet-stream";
  const buffer = await file.arrayBuffer();
  return new Blob([buffer], { type: mimeType });
}

export { ALLOWED_MIME_TYPES };
