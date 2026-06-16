import {
  getUsageCountFromSheets,
  isGoogleSheetsConfigured,
  recordUsageInSheets,
} from "@/lib/google-sheets";
import {
  getUsageCountMemory,
  recordUsageMemory,
} from "@/lib/usage-store";
import { normalizeUserName } from "@/lib/user-session";

export async function getUsageCount(userName: string): Promise<number> {
  const normalized = normalizeUserName(userName);
  if (!normalized) return 0;

  if (isGoogleSheetsConfigured()) {
    try {
      return await getUsageCountFromSheets(normalized);
    } catch (error) {
      console.error("[usage] getUsageCount sheets failed:", error);
      return getUsageCountMemory(normalized);
    }
  }

  return getUsageCountMemory(normalized);
}

export async function recordUsage(
  userName: string,
  metadata: {
    texture: string;
    quad: boolean;
    requestId: string;
  },
): Promise<number> {
  const normalized = normalizeUserName(userName);

  if (isGoogleSheetsConfigured()) {
    try {
      return await recordUsageInSheets(normalized, metadata);
    } catch (error) {
      console.error("[usage] recordUsage sheets failed:", error);
    }
  }

  const count = recordUsageMemory(normalized);
  console.info("[usage]", { userName: normalized, count, ...metadata });
  return count;
}
