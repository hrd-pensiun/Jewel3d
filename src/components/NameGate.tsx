"use client";

import Image from "next/image";
import { useState } from "react";

import { isValidUserName, normalizeUserName } from "@/lib/user-session";

type NameGateProps = {
  onSuccess: (userName: string, usageCount: number) => void;
};

export default function NameGate({ onSuccess }: NameGateProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidUserName(name)) {
      setError("Nama wajib diisi (minimal 2 karakter).");
      return;
    }

    const normalized = normalizeUserName(name);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/usage?userName=${encodeURIComponent(normalized)}`,
      );
      const data = (await response.json()) as {
        usageCount?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Gagal memuat data.");
      }

      onSuccess(normalized, data.usageCount ?? 0);
    } catch {
      onSuccess(normalized, 0);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#eef1f6] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="UBS GOLD"
            width={200}
            height={72}
            className="mx-auto h-16 w-auto bg-transparent object-contain sm:h-20"
            priority
          />
          <h2 className="mt-6 text-lg font-semibold text-wit-navy">
            Identitas Pengguna
          </h2>
          <p className="mt-2 text-sm text-wit-muted">
            Masukkan nama Anda untuk melanjutkan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="user-name"
              className="mb-1.5 block text-sm font-medium text-wit-navy"
            >
              Nama <span className="text-red-500">*</span>
            </label>
            <input
              id="user-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              placeholder="Contoh: Budi Santoso"
              autoComplete="name"
              maxLength={50}
              className="w-full rounded-xl border border-wit-border bg-white px-4 py-3 text-wit-navy placeholder:text-wit-muted/60 focus:border-wit-gold focus:outline-none focus:ring-2 focus:ring-wit-gold/20"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center rounded-xl wit-gradient-btn px-4 py-3 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Memuat…" : "Lanjutkan"}
          </button>
        </form>
      </div>
    </div>
  );
}
