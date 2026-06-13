"use client";

import { useState } from "react";

import { getProxiedModelUrl } from "@/lib/model-url";
import { exportGlbToStl } from "@/lib/stl-export";
import type { ModelFormat } from "@/lib/tripo";

type DownloadButtonsProps = {
  modelUrl: string;
  taskId: string;
  format: ModelFormat;
};

export default function DownloadButtons({
  modelUrl,
  taskId,
  format,
}: DownloadButtonsProps) {
  const [isExportingStl, setIsExportingStl] = useState(false);
  const [isDownloadingModel, setIsDownloadingModel] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const isFbx = format === "fbx";
  const extension = isFbx ? "fbx" : "glb";
  const label = isFbx ? "Download FBX" : "Download GLB";

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
      anchor.download = `jewel3d-${taskId}.${extension}`;
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
          onClick={handleModelDownload}
          disabled={isDownloadingModel || isExportingStl}
          className="min-h-12 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDownloadingModel ? `Mengunduh ${extension.toUpperCase()}…` : label}
        </button>
        {!isFbx && (
          <button
            type="button"
            onClick={handleStlDownload}
            disabled={isExportingStl || isDownloadingModel}
            className="min-h-12 rounded-lg border border-neutral-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingStl ? "Mengekspor STL…" : "Download STL"}
          </button>
        )}
      </div>
      {isFbx && (
        <p className="text-xs text-neutral-500">
          Output quad mesh berformat FBX — buka di Blender untuk retopology.
        </p>
      )}
      {downloadError && <p className="text-sm text-red-400">{downloadError}</p>}
    </div>
  );
}
