export function getProxiedModelUrl(modelUrl: string): string {
  return `/api/model?url=${encodeURIComponent(modelUrl)}`;
}
