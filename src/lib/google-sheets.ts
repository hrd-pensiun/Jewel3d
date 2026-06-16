import { google } from "googleapis";

import { normalizeUserName } from "@/lib/user-session";

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

function getCredentials(): ServiceAccountCredentials | null {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as ServiceAccountCredentials;
      if (parsed.client_email && parsed.private_key) return parsed;
    } catch {
      console.error("[google-sheets] Invalid GOOGLE_SERVICE_ACCOUNT_JSON");
    }
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (email && privateKey) {
    return { client_email: email, private_key: privateKey };
  }

  return null;
}

export function isGoogleSheetsConfigured(): boolean {
  return (
    Boolean(getCredentials()) && Boolean(process.env.GOOGLE_SHEETS_SPREADSHEET_ID)
  );
}

function getSheetsClient() {
  const credentials = getCredentials();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!credentials || !spreadsheetId) {
    throw new Error("Google Sheets not configured");
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return {
    sheets: google.sheets({ version: "v4", auth }),
    spreadsheetId,
    sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME ?? "UsageLog",
  };
}

export async function getUsageCountFromSheets(userName: string): Promise<number> {
  const { sheets, spreadsheetId, sheetName } = getSheetsClient();
  const normalized = normalizeUserName(userName).toLowerCase();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!B:B`,
  });

  const rows = response.data.values ?? [];
  return rows.filter((row) => {
    const cell = row[0];
    return (
      typeof cell === "string" &&
      normalizeUserName(cell).toLowerCase() === normalized
    );
  }).length;
}

export async function recordUsageInSheets(
  userName: string,
  metadata: {
    texture: string;
    quad: boolean;
    requestId: string;
  },
): Promise<number> {
  const { sheets, spreadsheetId, sheetName } = getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:E`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toISOString(),
          normalizeUserName(userName),
          metadata.texture,
          metadata.quad ? "ya" : "tidak",
          metadata.requestId,
        ],
      ],
    },
  });

  return getUsageCountFromSheets(userName);
}
