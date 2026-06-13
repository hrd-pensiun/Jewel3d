import { NextResponse } from "next/server";

const ALLOWED_HOSTS = ["fal.media", "fal.ai", "fal.run"];

function isAllowedModelUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");

  if (!url || !isAllowedModelUrl(url)) {
    return NextResponse.json(
      { error: "URL model tidak valid atau tidak diizinkan." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil file model dari server." },
        { status: 502 },
      );
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "model/gltf-binary",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[api/model]", error);
    return NextResponse.json(
      { error: "Gagal memuat model 3D." },
      { status: 500 },
    );
  }
}
