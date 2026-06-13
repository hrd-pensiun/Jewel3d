"use client";

import type { TextureOption } from "@/lib/pricing";

export type QualityMode = "standard" | "hd" | "quad";

type InfoPanelProps = {
  qualityMode: QualityMode;
  withTexture: boolean;
  onQualityModeChange: (mode: QualityMode) => void;
  onWithTextureChange: (value: boolean) => void;
  disabled?: boolean;
};

const QUALITY_OPTIONS: {
  value: QualityMode;
  label: string;
  description: string;
}[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Kualitas standar, proses cepat",
  },
  {
    value: "hd",
    label: "HD",
    description: "Kualitas tinggi, detail lebih baik",
  },
  {
    value: "quad",
    label: "Quad mesh",
    description: "Output FBX untuk retopology",
  },
];

export function deriveGenerateOptions(
  qualityMode: QualityMode,
  withTexture: boolean,
): { texture: TextureOption; quad: boolean } {
  const quad = qualityMode === "quad";

  if (!withTexture) {
    return { texture: "no", quad };
  }

  return {
    texture: qualityMode === "hd" ? "HD" : "standard",
    quad,
  };
}

export default function InfoPanel({
  qualityMode,
  withTexture,
  onQualityModeChange,
  onWithTextureChange,
  disabled = false,
}: InfoPanelProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-wit-border bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-wit-navy">
        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-wit-navy text-xs text-white">
          1
        </span>
        Info &amp; Pengaturan
      </h2>

      <fieldset className="mt-5 space-y-3" disabled={disabled}>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-wit-muted">
          Opsi Generate
        </legend>
        {QUALITY_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
              qualityMode === option.value
                ? "border-wit-gold bg-amber-50/60"
                : "border-wit-border hover:border-wit-gold/50"
            }`}
          >
            <input
              type="radio"
              name="quality"
              checked={qualityMode === option.value}
              onChange={() => onQualityModeChange(option.value)}
              className="mt-1 accent-[#c5a059]"
            />
            <span>
              <span className="block text-sm font-medium text-wit-navy">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-wit-muted">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="mt-5 space-y-2" disabled={disabled}>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-wit-muted">
          Tekstur
        </legend>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1">
          <input
            type="radio"
            name="texture-toggle"
            checked={withTexture}
            onChange={() => onWithTextureChange(true)}
            className="accent-[#c5a059]"
          />
          <span className="text-sm text-wit-navy">Dengan Tekstur</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1">
          <input
            type="radio"
            name="texture-toggle"
            checked={!withTexture}
            onChange={() => onWithTextureChange(false)}
            className="accent-[#c5a059]"
          />
          <span className="text-sm text-wit-navy">Tanpa Tekstur</span>
        </label>
      </fieldset>
    </div>
  );
}
