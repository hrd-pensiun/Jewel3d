"use client";

import {
  calculateCostUsd,
  formatIdr,
  formatUsd,
  type TextureOption,
} from "@/lib/pricing";

type OptionsPanelProps = {
  texture: TextureOption;
  quad: boolean;
  onTextureChange: (texture: TextureOption) => void;
  onQuadChange: (quad: boolean) => void;
  disabled?: boolean;
};

const TEXTURE_CHOICES: { value: TextureOption; label: string }[] = [
  { value: "no", label: "Tanpa Tekstur" },
  { value: "standard", label: "Standard" },
  { value: "HD", label: "HD" },
];

export default function OptionsPanel({
  texture,
  quad,
  onTextureChange,
  onQuadChange,
  disabled = false,
}: OptionsPanelProps) {
  const costUsd = calculateCostUsd(texture, quad);

  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900/50 p-6">
      <h2 className="mb-4 text-lg font-semibold">Opsi Generate</h2>

      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="mb-2 text-sm text-neutral-400">Tekstur</legend>
        {TEXTURE_CHOICES.map((choice) => (
          <label
            key={choice.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-neutral-800/60"
          >
            <input
              type="radio"
              name="texture"
              value={choice.value}
              checked={texture === choice.value}
              onChange={() => onTextureChange(choice.value)}
              className="accent-amber-400"
            />
            <span className="text-sm">{choice.label}</span>
          </label>
        ))}
      </fieldset>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-neutral-800/60">
        <input
          type="checkbox"
          checked={quad}
          disabled={disabled}
          onChange={(event) => onQuadChange(event.target.checked)}
          className="mt-0.5 accent-amber-400"
        />
        <span className="text-sm">
          Quad mesh (output FBX, untuk retopology)
          <span className="mt-0.5 block text-xs text-neutral-500">
            +$0.05 — mesh quad untuk retopology
          </span>
        </span>
      </label>

      <div className="mt-6 rounded-lg bg-neutral-800/80 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Estimasi biaya
        </p>
        <p className="mt-1 text-lg font-semibold text-amber-300">
          {formatUsd(costUsd)}{" "}
          <span className="text-base font-normal text-neutral-300">
            ({formatIdr(costUsd)})
          </span>
        </p>
      </div>
    </div>
  );
}
