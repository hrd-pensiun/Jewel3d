"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

import { APP_PIN } from "@/lib/pin";

type PinGateProps = {
  onSuccess: () => void;
};

const PIN_LENGTH = APP_PIN.length;

export default function PinGate({ onSuccess }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const submitPin = useCallback(
    (value: string) => {
      if (value.length < PIN_LENGTH) return;

      if (value === APP_PIN) {
        onSuccess();
        return;
      }

      setError(true);
      setPin("");
      window.setTimeout(() => setError(false), 500);
    },
    [onSuccess],
  );

  const appendDigit = useCallback(
    (digit: string) => {
      if (pin.length >= PIN_LENGTH) return;
      const next = pin + digit;
      setPin(next);
      setError(false);
      if (next.length === PIN_LENGTH) {
        submitPin(next);
      }
    },
    [pin, submitPin],
  );

  const removeDigit = useCallback(() => {
    setPin((current) => current.slice(0, -1));
    setError(false);
  }, []);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "ok"];

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#eef1f6] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/logo.png"
          alt="WIT 3D"
          width={160}
          height={56}
          className="mx-auto h-14 w-auto object-contain"
          priority
        />
        <p className="mt-4 text-sm text-wit-muted">Masukkan PIN untuk melanjutkan</p>

        <div
          className={`mt-8 flex justify-center gap-3 ${error ? "animate-[shake_0.45s_ease-in-out]" : ""}`}
          aria-label={`PIN ${pin.length} dari ${PIN_LENGTH}`}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <span
              key={index}
              className={`h-3.5 w-3.5 rounded-full border-2 transition-colors ${
                index < pin.length
                  ? "border-wit-gold bg-wit-gold"
                  : "border-wit-border bg-white"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600">PIN salah. Coba lagi.</p>
        )}

        <div className="mt-10 grid grid-cols-3 gap-3">
          {keys.map((key) => {
            if (key === "back") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={removeDigit}
                  className="flex h-16 items-center justify-center rounded-full border border-wit-border bg-white text-lg font-medium text-wit-navy active:scale-95"
                  aria-label="Hapus digit"
                >
                  ⌫
                </button>
              );
            }

            if (key === "ok") {
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => submitPin(pin)}
                  disabled={pin.length < PIN_LENGTH}
                  className="flex h-16 items-center justify-center rounded-full wit-gradient-btn text-lg font-semibold text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  OK
                </button>
              );
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => appendDigit(key)}
                className="flex h-16 items-center justify-center rounded-full border border-wit-border bg-white text-2xl font-medium text-wit-navy active:scale-95 active:bg-amber-50"
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
