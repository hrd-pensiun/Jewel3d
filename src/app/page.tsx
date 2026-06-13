"use client";

import { useEffect, useMemo, useState } from "react";

import InfoPanel, { deriveGenerateOptions, type QualityMode } from "@/components/InfoPanel";
import AppHeader from "@/components/layout/AppHeader";
import StepProgress from "@/components/layout/StepProgress";
import PinGate from "@/components/PinGate";
import ResultPanel from "@/components/ResultPanel";
import UploadPanel from "@/components/UploadPanel";
import { parseJsonResponse, sleep } from "@/lib/fetch-json";
import { PIN_SESSION_KEY } from "@/lib/pin";
import { toUserError, USER_MESSAGES } from "@/lib/user-messages";
import type { ModelFormat } from "@/lib/tripo";

type GenerateResult = {
  taskId: string;
  modelUrl: string;
  previewUrl: string | null;
  format: ModelFormat;
};

type SubmitResponse = {
  requestId: string;
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
  const [qualityMode, setQualityMode] = useState<QualityMode>("standard");
  const [withTexture, setWithTexture] = useState(true);
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResult | null>(null);

  const { texture, quad } = useMemo(
    () => deriveGenerateOptions(qualityMode, withTexture),
    [qualityMode, withTexture],
  );

  const isLoading = status === "uploading" || status === "generating";

  const currentStep = useMemo(() => {
    if (result || isLoading) return 3 as const;
    if (file) return 2 as const;
    return 1 as const;
  }, [file, result, isLoading]);

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
        throw new Error(toUserError(data.error));
      }

      if (data.status === "IN_QUEUE") {
        setStatusMessage(
          data.queuePosition
            ? USER_MESSAGES.queuePosition(data.queuePosition)
            : USER_MESSAGES.queue,
        );
        continue;
      }

      if (data.status === "IN_PROGRESS") {
        setStatusMessage(USER_MESSAGES.generating);
        continue;
      }

      if (data.status === "COMPLETED" && data.modelUrl && data.taskId) {
        return {
          taskId: data.taskId,
          modelUrl: data.modelUrl,
          previewUrl: data.previewUrl ?? null,
          format: data.format ?? format,
        };
      }
    }

    throw new Error(USER_MESSAGES.processingTimeout);
  }

  async function resumePendingJob(pending: {
    requestId: string;
    format: ModelFormat;
  }) {
    setStatus("generating");
    setStatusMessage(USER_MESSAGES.resuming);
    setError(null);

    try {
      const completed = await pollGenerateStatus(
        pending.requestId,
        pending.format,
      );
      sessionStorage.removeItem(PENDING_JOB_KEY);
      setResult(completed);
      setStatus("done");
      setStatusMessage("");
    } catch (resumeError) {
      setStatus("error");
      setStatusMessage("");
      setError(toUserError(
        resumeError instanceof Error ? resumeError.message : null,
      ));
    }
  }

  async function handleGenerate() {
    if (!file || isLoading) return;

    setError(null);
    setResult(null);
    setStatus("uploading");
    setStatusMessage(USER_MESSAGES.uploading);

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
        throw new Error(toUserError(submitData.error));
      }

      sessionStorage.setItem(
        PENDING_JOB_KEY,
        JSON.stringify({
          requestId: submitData.requestId,
          format: submitData.format,
        }),
      );

      setStatus("generating");
      setStatusMessage(USER_MESSAGES.accepted);

      const completed = await pollGenerateStatus(
        submitData.requestId,
        submitData.format,
      );

      sessionStorage.removeItem(PENDING_JOB_KEY);
      setResult(completed);
      setStatus("done");
      setStatusMessage("");
    } catch (generateError) {
      setStatus("error");
      setStatusMessage("");
      setError(toUserError(
        generateError instanceof Error ? generateError.message : null,
      ));
    }
  }

  function handleReset() {
    setFile(null);
    setResult(null);
    setError(null);
    setStatus("idle");
    setStatusMessage("");
    sessionStorage.removeItem(PENDING_JOB_KEY);
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
    <div className="min-h-[100dvh] bg-[#eef1f6]">
      <AppHeader />
      <StepProgress currentStep={currentStep} />

      <main
        id="generate"
        className="mx-auto max-w-[1400px] px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-stretch lg:gap-6">
          <InfoPanel
            qualityMode={qualityMode}
            withTexture={withTexture}
            onQualityModeChange={setQualityMode}
            onWithTextureChange={setWithTexture}
            disabled={isLoading}
          />

          <UploadPanel
            file={file}
            onFileSelect={setFile}
            disabled={isLoading}
          />

          <ResultPanel
            result={result}
            isLoading={isLoading}
            statusMessage={statusMessage}
            onReset={handleReset}
          />
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!file || isLoading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl wit-gradient-btn px-6 py-3.5 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50 lg:max-w-md lg:mx-auto"
          >
            {isLoading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {isLoading ? "Sedang diproses…" : "Generate Model 3D"}
          </button>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
