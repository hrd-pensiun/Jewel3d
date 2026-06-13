"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import DownloadButtons from "@/components/DownloadButtons";
import type { ModelFormat } from "@/lib/tripo";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl bg-[#f8fafc]">
      <p className="text-sm text-wit-muted">Memuat viewer 3D…</p>
    </div>
  ),
});

type ResultPanelProps = {
  result: {
    taskId: string;
    modelUrl: string;
    previewUrl: string | null;
    costUsd: number;
    format: ModelFormat;
    requestId?: string;
  } | null;
  isLoading: boolean;
  statusMessage: string;
  onReset: () => void;
};

const MOCK_STATS = [
  { label: "Polygons", value: "512,340" },
  { label: "Vertices", value: "256,789" },
  { label: "Textures", value: "4K" },
  { label: "File Size", value: "18.7 MB" },
];

const FORMAT_TABS = [".GLB", ".OBJ", ".FBX", ".USDZ", ".STL"];

export default function ResultPanel({
  result,
  isLoading,
  statusMessage,
  onReset,
}: ResultPanelProps) {
  const [activeFormat, setActiveFormat] = useState(".GLB");

  const effectiveFormat =
    result?.format === "fbx"
      ? ".FBX"
      : activeFormat === ".STL"
        ? ".STL"
        : ".GLB";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-wit-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-wit-navy">
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-wit-navy text-xs text-white">
            3
          </span>
          Hasil 3D
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-wit-border px-3 py-1.5 text-xs font-medium text-wit-muted hover:bg-[#f8fafc]"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!result}
            title="Mockup — unduh GLB/STL via tombol di bawah"
            className="hidden rounded-lg wit-gradient-btn px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 sm:block"
          >
            Download All
          </button>
        </div>
      </div>

      <div className="relative mt-4 flex-1 overflow-hidden rounded-xl border border-wit-border bg-[#f8fafc]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-wit-gold/30 border-t-wit-gold" />
            <p className="max-w-[200px] text-center text-sm text-wit-muted">
              {statusMessage || "Memproses…"}
            </p>
          </div>
        )}

        {!result && !isLoading && (
          <div className="flex h-64 flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 text-4xl opacity-30">◇</div>
            <p className="text-sm font-medium text-wit-navy">
              Model 3D akan muncul di sini
            </p>
            <p className="mt-1 text-xs text-wit-muted">
              Upload gambar lalu klik Generate
            </p>
          </div>
        )}

        {result && (
          <div className="p-3">
            {result.format === "glb" ? (
              <ModelViewer modelUrl={result.modelUrl} />
            ) : result.previewUrl ? (
              <div className="flex h-64 items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={result.previewUrl}
                  alt="Preview model"
                  className="max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center p-4 text-sm text-wit-muted">
                Preview FBX — unduh file untuk dibuka di Blender
              </div>
            )}
          </div>
        )}
      </div>

      {result && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MOCK_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-wit-border bg-[#f8fafc] px-3 py-2 text-center"
              >
                <p className="text-[10px] uppercase tracking-wide text-wit-muted">
                  {stat.label}
                </p>
                <p className="text-sm font-semibold text-wit-navy">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {FORMAT_TABS.map((format) => {
              const isSupported =
                format === ".GLB" ||
                format === ".STL" ||
                (format === ".FBX" && result.format === "fbx");
              const isActive = effectiveFormat === format;

              return (
                <button
                  key={format}
                  type="button"
                  disabled={!isSupported}
                  onClick={() => isSupported && setActiveFormat(format)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive && isSupported
                      ? "bg-wit-navy text-white"
                      : isSupported
                        ? "border border-wit-border text-wit-navy hover:border-wit-navy"
                        : "cursor-not-allowed border border-wit-border text-wit-muted/50"
                  }`}
                  title={!isSupported ? "Mockup — belum tersedia" : undefined}
                >
                  {format}
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <DownloadButtons
              modelUrl={result.modelUrl}
              taskId={result.taskId}
              format={result.format}
              highlightFormat={effectiveFormat}
            />
          </div>
        </>
      )}
    </div>
  );
}
