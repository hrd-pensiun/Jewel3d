"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import DownloadButtons from "@/components/DownloadButtons";
import OptionsPanel from "@/components/OptionsPanel";
import PinGate from "@/components/PinGate";
import UploadZone from "@/components/UploadZone";
import { parseJsonResponse, sleep } from "@/lib/fetch-json";
import { PIN_SESSION_KEY } from "@/lib/pin";
import { type TextureOption } from "@/lib/pricing";
import type { ModelFormat } from "@/lib/tripo";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[50vh] items-center justify-center rounded-xl bg-neutral-900 sm:h-[60vh]">
      <p className="text-neutral-500">Memuat viewer 3D…</p>
    </div>
  ),
});

type GenerateResult = {
  taskId: string;
  modelUrl: string;
  previewUrl: string | null;
  costUsd: number;
  format: ModelFormat;
  requestId?: string;
};

type SubmitResponse = {
  requestId: string;
  costUsd: number;
  format: ModelFormat;
  error?: string;
};

type StatusResponse = {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  queuePosition?: number;
  taskId?: string;
  modelUrl?: string;
  previewUrl?: string | null;
  format?: ModelFormat;
  error?: string;
};

type GenerateStatus = "idle" | "uploading" | "generating" | "done" | "error";

const PENDING_JOB_KEY = "jewel3d_pending_job";

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [texture, setTexture] = useState<TextureOption>("standard");
  const [quad, setQuad] = useState(false);
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const isLoading = status === "uploading" || status === "generating";

  useEffect(() => {
    if (sessionStorage.getItem(PIN_SESSION_KEY) === "1") {
      setUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;

    const raw = sessionStorage.getItem(PENDING_JOB_KEY);
    if (!raw) return;

    try {
      const pending = JSON.parse(raw) as {
        requestId: string;
        costUsd: number;
        format: ModelFormat;
      };

      void resumePendingJob(pending);
    } catch {
      sessionStorage.removeItem(PENDING_JOB_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  async function pollGenerateStatus(
    requestId: string,
    costUsd: number,
    format: ModelFormat,
  ): Promise<GenerateResult> {
    const maxAttempts = 90;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await sleep(attempt === 0 ? 1500 : 2500);

      const response = await fetch(
        `/api/generate/status?requestId=${encodeURIComponent(requestId)}`,
      );
      const data = await parseJsonResponse<StatusResponse>(response);

      if (!response.ok || data.status === "FAILED") {
        throw new Error(data.error ?? "Generate gagal.");
      }

      if (data.status === "IN_QUEUE") {
        setStatusMessage(
          data.queuePosition
            ? `Antrian fal.ai… posisi ${data.queuePosition}`
            : "Antrian fal.ai…",
        );
        continue;
      }

      if (data.status === "IN_PROGRESS") {
        setStatusMessage("Men-generate model 3D… (±30–60 detik)");
        continue;
      }

      if (data.status === "COMPLETED" && data.modelUrl && data.taskId) {
        return {
          requestId,
          taskId: data.taskId,
          modelUrl: data.modelUrl,
          previewUrl: data.previewUrl ?? null,
          costUsd,
          format: data.format ?? format,
        };
      }
    }

    throw new Error(
      `Generate masih berjalan. Simpan Request ID: ${requestId} — cek fal.ai dashboard.`,
    );
  }

  async function resumePendingJob(pending: {
    requestId: string;
    costUsd: number;
    format: ModelFormat;
  }) {
    setStatus("generating");
    setStatusMessage("Melanjutkan generate yang sedang berjalan…");
    setError(null);

    try {
      const completed = await pollGenerateStatus(
        pending.requestId,
        pending.costUsd,
        pending.format,
      );
      sessionStorage.removeItem(PENDING_JOB_KEY);
      setResult(completed);
      setStatus("done");
      setStatusMessage("");
    } catch (resumeError) {
      setStatus("error");
      setStatusMessage("");
      setError(
        resumeError instanceof Error
          ? resumeError.message
          : "Gagal melanjutkan generate.",
      );
    }
  }

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
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const submitData = await parseJsonResponse<SubmitResponse>(response);

      if (!response.ok || !submitData.requestId) {
        throw new Error(submitData.error ?? "Gagal mengirim permintaan generate.");
      }

      sessionStorage.setItem(
        PENDING_JOB_KEY,
        JSON.stringify({
          requestId: submitData.requestId,
          costUsd: submitData.costUsd,
          format: submitData.format,
        }),
      );

      setStatus("generating");
      setStatusMessage("Permintaan diterima. Menunggu fal.ai…");

      const completed = await pollGenerateStatus(
        submitData.requestId,
        submitData.costUsd,
        submitData.format,
      );

      sessionStorage.removeItem(PENDING_JOB_KEY);
      setResult(completed);
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

  if (!unlocked) {
    return (
      <PinGate
        onSuccess={() => {
          sessionStorage.setItem(PIN_SESSION_KEY, "1");
          setUnlocked(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-white">
      <header className="border-b border-neutral-800 px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Jewel 3d</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Foto perhiasan → Model 3D untuk preview &amp; 3D print
        </p>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:space-y-6 sm:px-6 sm:py-8">
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
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-base font-semibold text-neutral-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
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
          <section className="space-y-5 sm:space-y-6">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
              <h2 className="text-lg font-semibold">Hasil Generate</h2>
              <p className="mt-1 text-sm text-neutral-400">
                Task ID: {result.taskId} · Biaya: ${result.costUsd.toFixed(2)} ·
                Format: {result.format.toUpperCase()}
              </p>
              {result.requestId && (
                <p className="mt-1 text-xs text-neutral-500">
                  Request ID: {result.requestId}
                </p>
              )}

              {result.previewUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-neutral-500">
                    Preview render
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.previewUrl}
                    alt="Preview model 3D"
                    className="max-h-64 w-full rounded-lg object-contain"
                  />
                </div>
              )}
            </div>

            {result.format === "glb" ? (
              <ModelViewer modelUrl={result.modelUrl} />
            ) : (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-sm text-neutral-400">
                Preview 3D tidak tersedia untuk output FBX. Unduh file FBX
                untuk dibuka di Blender.
              </div>
            )}

            <DownloadButtons
              modelUrl={result.modelUrl}
              taskId={result.taskId}
              format={result.format}
            />
          </section>
        )}
      </main>
    </div>
  );
}
