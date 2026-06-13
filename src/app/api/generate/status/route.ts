import { NextResponse } from "next/server";

import { fal } from "@/lib/fal";
import { TRIPO_ENDPOINT, parseTripoOutput } from "@/lib/tripo";
import { API_ERROR_RESPONSE } from "@/lib/user-messages";

export const maxDuration = 15;

export async function GET(request: Request) {
  if (!process.env.FAL_KEY) {
    console.error("[api/generate/status] FAL_KEY missing");
    return NextResponse.json({ error: API_ERROR_RESPONSE }, { status: 500 });
  }

  const requestId = new URL(request.url).searchParams.get("requestId");

  if (!requestId) {
    return NextResponse.json({ error: API_ERROR_RESPONSE }, { status: 400 });
  }

  try {
    const queueStatus = await fal.queue.status(TRIPO_ENDPOINT, { requestId });

    if (queueStatus.status === "IN_QUEUE") {
      return NextResponse.json({
        status: "IN_QUEUE",
        queuePosition: queueStatus.queue_position,
      });
    }

    if (queueStatus.status === "IN_PROGRESS") {
      return NextResponse.json({ status: "IN_PROGRESS" });
    }

    const result = await fal.queue.result(TRIPO_ENDPOINT, { requestId });
    const parsed = parseTripoOutput(result.data);

    if (!parsed) {
      console.error("[api/generate/status] model_mesh missing in response");
      return NextResponse.json({ error: API_ERROR_RESPONSE }, { status: 502 });
    }

    return NextResponse.json({
      status: "COMPLETED",
      ...parsed,
    });
  } catch (error) {
    console.error("[api/generate/status]", error);

    return NextResponse.json(
      { status: "FAILED", error: API_ERROR_RESPONSE },
      { status: 500 },
    );
  }
}
