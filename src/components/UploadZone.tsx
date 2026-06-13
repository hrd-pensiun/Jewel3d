"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  inferImageMimeType,
  isHeicImage,
} from "@/lib/image-upload";

type UploadZoneProps = {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

export default function UploadZone({
  file,
  onFileSelect,
  disabled = false,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = useCallback(
    (selected: File | null) => {
      setError(null);

      if (!selected) {
        onFileSelect(null);
        setPreviewUrl(null);
        return;
      }

      if (selected.size === 0) {
        setError("File kosong atau tidak bisa dibaca. Coba pilih ulang.");
        return;
      }

      if (isHeicImage(selected)) {
        setError(
          "Format HEIC tidak didukung. Simpan sebagai JPEG/PNG di iPhone atau Mac.",
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
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(selected);
      });
    },
    [onFileSelect],
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const dropped = event.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [disabled, handleFile],
  );

  return (
    <div className="space-y-3">
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
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-amber-400 bg-amber-400/10"
            : "border-neutral-600 bg-neutral-900/50 hover:border-neutral-500"
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
            handleFile(selected);
            event.target.value = "";
          }}
        />

        {previewUrl ? (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview foto perhiasan"
              className="max-h-48 rounded-lg object-contain"
            />
            <p className="text-sm text-neutral-400">{file?.name}</p>
            <p className="text-xs text-neutral-500">
              Klik atau tarik file lain untuk mengganti
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-neutral-300">
              Tarik foto perhiasan ke sini atau klik untuk memilih
            </p>
            <p className="text-xs text-neutral-500">JPEG, PNG, WebP — maks. 10 MB</p>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
