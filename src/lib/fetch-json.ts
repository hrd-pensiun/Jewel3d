export async function parseJsonResponse<T extends { error?: string }>(
  response: Response,
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  const text = (await response.text()).trim();
  const fallback =
    response.status === 504
      ? "Server timeout — generate mungkin masih berjalan. Coba refresh atau cek fal.ai dashboard."
      : text.slice(0, 160) || "Respons server tidak valid.";

  return { error: fallback } as T;
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
