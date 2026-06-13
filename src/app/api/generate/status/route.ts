import { NextResponse } from "next/server";

import { fal } from "@/lib/fal";
import { TRIPO_ENDPOINT, parseTripoOutput } from "@/lib/tripo";

export const maxDuration = 15;

export async function GET(request: Request) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: "FAL_KEY belum dikonfigurasi di server." },
      { status: 500 },
    );
  }

  const requestId = new URL(request.url).searchParams.get("requestId");

  if (!requestId) {
    return NextResponse.json(
      { error: "requestId wajib diisi." },
      { status: 400 },
    );
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
      return NextResponse.json(
        { error: "Model 3D tidak ditemukan dalam respons API." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      status: "COMPLETED",
      ...parsed,
    });
  } catch (error) {
    console.error("[api/generate/status]", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        status: "FAILED",
        error:
          message.includes("404") || message.includes("not found")
            ? "Permintaan generate tidak ditemukan atau sudah kedaluwarsa."
            : "Generate gagal. Coba lagi atau cek fal.ai dashboard.",
      },
      { status: 500 },
    );
  }
}
