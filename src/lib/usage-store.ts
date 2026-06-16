import { normalizeUserName } from "@/lib/user-session";

// In-memory fallback when Google Sheets is not configured.
// Resets on serverless cold start — configure Google Sheets for production.

const memoryUsage = new Map<string, number>();

export function recordUsageMemory(userName: string): number {
  const key = normalizeUserName(userName).toLowerCase();
  const next = (memoryUsage.get(key) ?? 0) + 1;
  memoryUsage.set(key, next);
  return next;
}

export function getUsageCountMemory(userName: string): number {
  const key = normalizeUserName(userName).toLowerCase();
  return memoryUsage.get(key) ?? 0;
}
