"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import DownloadButtons from "@/components/DownloadButtons";
import OptionsPanel from "@/components/OptionsPanel";
import UploadZone from "@/components/UploadZone";
import { type TextureOption } from "@/lib/pricing";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center rounded-xl bg-neutral-900">
      <p className="text-neutral-500">Memuat viewer 3D…</p>
    </div>
  ),
});

type GenerateResult = {
  taskId: string;
  modelUrl: string;
  previewUrl: string | null;
  costUsd: number;
};

type GenerateStatus = "idle" | "uploading" | "generating" | "done" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [texture, setTexture] = useState<TextureOption>("standard");
  const [quad, setQuad] = useState(false);
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const isLoading = status === "uploading" || status === "generating";

  async function handleGenerate() {
    if (!file || isLoading) return;

    setError(null);
    setResult(null);
    setStatus("uploading");
    setStatusMessage("Mengunggah gambar…");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("texture", texture);
    formData.append("quad", String(quad));
    formData.append("orientation", "align_image");

    try {
      setStatus("generating");
      setStatusMessage("Men-generate model 3D… (±30–60 detik)");

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as GenerateResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal generate model 3D.");
      }

      setResult(data);
      setStatus("done");
      setStatusMessage("");
    } catch (generateError) {
      setStatus("error");
      setStatusMessage("");
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Terjadi kesalahan saat generate.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight">Jewel 3d</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Foto perhiasan → Model 3D untuk preview &amp; 3D print
        </p>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <UploadZone
          file={file}
          onFileSelect={setFile}
          disabled={isLoading}
        />

        <OptionsPanel
          texture={texture}
          quad={quad}
          onTextureChange={setTexture}
          onQuadChange={setQuad}
          disabled={isLoading}
        />

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!file || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-950/30 border-t-neutral-950" />
          )}
          {isLoading ? "Sedang diproses…" : "Generate Model 3D"}
        </button>

        {statusMessage && (
          <p className="text-center text-sm text-neutral-400">{statusMessage}</p>
        )}

        {error && (
          <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {result && (
          <section className="space-y-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
              <h2 className="text-lg font-semibold">Hasil Generate</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Task ID: {result.taskId} · Biaya: ${result.costUsd.toFixed(2)}
              </p>

              {result.previewUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
                    Preview render
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.previewUrl}
                    alt="Preview model 3D"
                    className="max-h-64 rounded-lg object-contain"
                  />
                </div>
              )}
            </div>

            <ModelViewer modelUrl={result.modelUrl} />

            <DownloadButtons
              modelUrl={result.modelUrl}
              taskId={result.taskId}
            />
          </section>
        )}
      </main>
    </div>
  );
}
