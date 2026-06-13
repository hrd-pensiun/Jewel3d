export const USD_TO_IDR = 16_500;

export type TextureOption = "no" | "standard" | "HD";

const TEXTURE_COST_USD: Record<TextureOption, number> = {
  no: 0.2,
  standard: 0.3,
  HD: 0.4,
};

const QUAD_SURCHARGE_USD = 0.05;

export function calculateCostUsd(texture: TextureOption, quad: boolean): number {
  return TEXTURE_COST_USD[texture] + (quad ? QUAD_SURCHARGE_USD : 0);
}

export function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function formatIdr(usd: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(usd * USD_TO_IDR);
}
