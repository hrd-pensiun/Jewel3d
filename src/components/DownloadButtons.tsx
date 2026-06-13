"use client";

import { useState } from "react";

import { getProxiedModelUrl } from "@/lib/model-url";
import { exportGlbToStl } from "@/lib/stl-export";
import type { ModelFormat } from "@/lib/tripo";

type DownloadButtonsProps = {
  modelUrl: string;
  taskId: string;
  format: ModelFormat;
  highlightFormat?: string;
};

export default function DownloadButtons({
  modelUrl,
  taskId,
  format,
  highlightFormat = ".GLB",
}: DownloadButtonsProps) {
  const [isExportingStl, setIsExportingStl] = useState(false);
  const [isDownloadingModel, setIsDownloadingModel] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isFbx = format === "fbx";
  const extension = isFbx ? "fbx" : "glb";

  async function handleModelDownload() {
    setDownloadError(null);
    setIsDownloadingModel(true);

    try {
      const response = await fetch(getProxiedModelUrl(modelUrl));
      if (!response.ok) {
        throw new Error(`Gagal mengunduh ${extension.toUpperCase()}.`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `wit3d-${taskId}.${extension}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[DownloadButtons] model download failed:", error);
      setDownloadError(`Gagal mengunduh ${extension.toUpperCase()}. Coba lagi.`);
    } finally {
      setIsDownloadingModel(false);
    }
  }

  async function handleStlDownload() {
    setDownloadError(null);
    setIsExportingStl(true);

    try {
      await exportGlbToStl(modelUrl, `wit3d-${taskId}.stl`);
    } catch (error) {
      console.error("[DownloadButtons] STL export failed:", error);
      setDownloadError("Gagal mengekspor STL. Coba lagi.");
    } finally {
      setIsExportingStl(false);
    }
  }

  const showGlb = highlightFormat === ".GLB" || highlightFormat === ".FBX";
  const showStl = highlightFormat === ".STL";

  return (
    <div className="space-y-2">
      {(showGlb || isFbx) && (
        <button
          type="button"
          onClick={handleModelDownload}
          disabled={isDownloadingModel || isExportingStl}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl wit-gradient-btn px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden>↓</span>
          {isDownloadingModel
            ? `Mengunduh ${extension.toUpperCase()}…`
            : `Download ${isFbx ? "FBX" : "GLB"}`}
        </button>
      )}

      {showStl && !isFbx && (
        <button
          type="button"
          onClick={handleStlDownload}
          disabled={isExportingStl || isDownloadingModel}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl wit-gradient-btn px-4 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden>↓</span>
          {isExportingStl ? "Mengekspor STL…" : "Download STL"}
        </button>
      )}

      {downloadError && (
        <p className="text-center text-sm text-red-600">{downloadError}</p>
      )}
    </div>
  );
}
