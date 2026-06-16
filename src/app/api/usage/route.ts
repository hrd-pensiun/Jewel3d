import { NextResponse } from "next/server";

import { getUsageCount } from "@/lib/usage";
import { isValidUserName, normalizeUserName } from "@/lib/user-session";
import { API_ERROR_RESPONSE } from "@/lib/user-messages";

export async function GET(request: Request) {
  const userName = new URL(request.url).searchParams.get("userName");

  if (!userName || !isValidUserName(userName)) {
    return NextResponse.json({ error: "Nama tidak valid." }, { status: 400 });
  }

  try {
    const usageCount = await getUsageCount(normalizeUserName(userName));
    return NextResponse.json({ usageCount });
  } catch (error) {
    console.error("[api/usage]", error);
    return NextResponse.json({ error: API_ERROR_RESPONSE }, { status: 500 });
  }
}
