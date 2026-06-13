"use client";

import { useState } from "react";

import { getProxiedModelUrl } from "@/lib/model-url";
import { exportGlbToStl } from "@/lib/stl-export";

type DownloadButtonsProps = {
  modelUrl: string;
  taskId: string;
};

export default function DownloadButtons({
  modelUrl,
  taskId,
}: DownloadButtonsProps) {
  const [isExportingStl, setIsExportingStl] = useState(false);
  const [isDownloadingGlb, setIsDownloadingGlb] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleGlbDownload() {
    setDownloadError(null);
    setIsDownloadingGlb(true);

    try {
      const response = await fetch(getProxiedModelUrl(modelUrl));
      if (!response.ok) {
        throw new Error("Gagal mengunduh GLB.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `jewel3d-${taskId}.glb`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[DownloadButtons] GLB download failed:", error);
      setDownloadError("Gagal mengunduh GLB. Coba lagi.");
    } finally {
      setIsDownloadingGlb(false);
    }
  }

  async function handleStlDownload() {
    setDownloadError(null);
    setIsExportingStl(true);

    try {
      await exportGlbToStl(modelUrl, `jewel3d-${taskId}.stl`);
    } catch (error) {
      console.error("[DownloadButtons] STL export failed:", error);
      setDownloadError("Gagal mengekspor STL. Coba lagi.");
    } finally {
      setIsExportingStl(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleGlbDownload}
          disabled={isDownloadingGlb || isExportingStl}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDownloadingGlb ? "Mengunduh GLB…" : "Download GLB"}
        </button>
        <button
          type="button"
          onClick={handleStlDownload}
          disabled={isExportingStl || isDownloadingGlb}
          className="rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExportingStl ? "Mengekspor STL…" : "Download STL"}
        </button>
      </div>
      {downloadError && <p className="text-sm text-red-400">{downloadError}</p>}
    </div>
  );
}
