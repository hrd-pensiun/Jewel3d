"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  inferImageMimeType,
  isHeicImage,
} from "@/lib/image-upload";

const SAMPLE_IMAGE = "/sample-ring.png";
const SAMPLE_COUNT = 5;

type UploadPanelProps = {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

export default function UploadPanel({
  file,
  onFileSelect,
  disabled = false,
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback(
    (selected: File | null, sampleIndex: number | null = null) => {
      setError(null);

      if (!selected) {
        onFileSelect(null);
        setPreviewUrl(null);
        setSelectedSample(null);
        return;
      }

      if (selected.size === 0) {
        setError("File kosong atau tidak bisa dibaca. Coba pilih ulang.");
        return;
      }

      if (isHeicImage(selected)) {
        setError(
          "Format HEIC tidak didukung. Simpan sebagai JPEG/PNG terlebih dahulu.",
        );
        return;
      }

      if (!inferImageMimeType(selected)) {
        setError("Format harus JPEG, PNG, atau WebP.");
        return;
      }

      if (selected.size > 10 * 1024 * 1024) {
        setError("Ukuran file maksimal 10 MB.");
        return;
      }

      onFileSelect(selected);
      setSelectedSample(sampleIndex);
      setPreviewUrl((current) => {
        if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
        return URL.createObjectURL(selected);
      });
    },
    [onFileSelect],
  );

  async function loadSample(index: number) {
    if (disabled) return;

    try {
      const response = await fetch(SAMPLE_IMAGE);
      const blob = await response.blob();
      const sampleFile = new File([blob], `sample-ring-${index + 1}.png`, {
        type: "image/png",
      });
      handleFile(sampleFile, index);
    } catch {
      setError("Gagal memuat contoh gambar.");
    }
  }

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const dropped = event.dataTransfer.files[0];
      if (dropped) handleFile(dropped, null);
    },
    [disabled, handleFile],
  );

  return (
    <div
      id="upload-panel"
      className="flex h-full flex-col rounded-2xl border border-wit-border bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-base font-semibold text-wit-navy">
        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-wit-navy text-xs text-white">
          2
        </span>
        Upload Gambar
      </h2>

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`mt-5 flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          isDragging
            ? "border-wit-gold bg-amber-50/50"
            : "border-wit-border bg-[#f8fafc] hover:border-wit-gold/60"
        } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            handleFile(selected, null);
            event.target.value = "";
          }}
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview upload"
              className="max-h-40 rounded-lg object-contain"
            />
            <p className="text-sm font-medium text-wit-navy">{file?.name}</p>
            <p className="text-xs text-wit-muted">Klik untuk ganti gambar</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-wit-navy/5 text-2xl text-wit-navy">
              ☁
            </div>
            <p className="text-sm font-medium text-wit-navy">
              Drag &amp; drop gambar di sini
            </p>
            <p className="mt-1 text-xs text-wit-muted">atau</p>
            <span className="mt-3 inline-block rounded-lg border border-wit-border bg-white px-4 py-2 text-sm font-medium text-wit-navy shadow-sm">
              Pilih Gambar
            </span>
            <p className="mt-3 text-xs text-wit-muted">
              PNG, JPG, WEBP — maks. 10 MB
            </p>
          </>
        )}
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-wit-muted">
          Contoh Gambar
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: SAMPLE_COUNT }).map((_, index) => (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => loadSample(index)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                selectedSample === index
                  ? "border-wit-gold ring-2 ring-wit-gold/30"
                  : "border-wit-border hover:border-wit-gold/50"
              }`}
            >
              <Image
                src={SAMPLE_IMAGE}
                alt={`Contoh ${index + 1}`}
                fill
                className="object-cover"
                sizes="56px"
              />
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
