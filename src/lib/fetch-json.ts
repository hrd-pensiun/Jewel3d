import { USER_MESSAGES } from "@/lib/user-messages";

export async function parseJsonResponse<T extends { error?: string }>(
  response: Response,
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  const fallback =
    response.status === 504
      ? USER_MESSAGES.processingTimeout
      : USER_MESSAGES.genericError;

  return { error: fallback } as T;
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
