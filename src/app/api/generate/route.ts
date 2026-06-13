import { NextResponse } from "next/server";

import { fal } from "@/lib/fal";
import {
  inferImageMimeType,
  isHeicImage,
  toUploadBlob,
} from "@/lib/image-upload";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { type TextureOption } from "@/lib/pricing";
import { TRIPO_ENDPOINT } from "@/lib/tripo";
import { API_ERROR_RESPONSE } from "@/lib/user-messages";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TEXTURE_OPTIONS = new Set<TextureOption>(["no", "standard", "HD"]);
const ORIENTATION_OPTIONS = new Set(["default", "align_image"]);

export const maxDuration = 30;

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Terlalu banyak permintaan. Coba lagi dalam ${rateLimit.retryAfterSec} detik.`,
      },
      { status: 429 },
    );
  }

  if (!process.env.FAL_KEY) {
    console.error("[api/generate] FAL_KEY missing");
    return NextResponse.json({ error: API_ERROR_RESPONSE }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const textureRaw = formData.get("texture");
    const quadRaw = formData.get("quad");
    const orientationRaw = formData.get("orientation");

    if (!(image instanceof File)) {
      return NextResponse.json(
        { error: "File gambar wajib diunggah." },
        { status: 400 },
      );
    }

    if (isHeicImage(image)) {
      return NextResponse.json(
        {
          error:
            "Format HEIC/HEIF tidak didukung. Simpan foto sebagai JPEG atau PNG terlebih dahulu.",
        },
        { status: 400 },
      );
    }

    const mimeType = inferImageMimeType(image);
    if (!mimeType) {
      return NextResponse.json(
        { error: "Format gambar harus JPEG, PNG, atau WebP." },
        { status: 400 },
      );
    }

    if (image.size === 0) {
      return NextResponse.json(
        { error: "File gambar kosong atau tidak bisa dibaca." },
        { status: 400 },
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ukuran gambar maksimal 10 MB." },
        { status: 400 },
      );
    }

    const texture =
      typeof textureRaw === "string" &&
      TEXTURE_OPTIONS.has(textureRaw as TextureOption)
        ? (textureRaw as TextureOption)
        : null;

    if (!texture) {
      return NextResponse.json(
        { error: "Opsi tekstur tidak valid." },
        { status: 400 },
      );
    }

    const quad = quadRaw === "true";
    const orientation =
      typeof orientationRaw === "string" &&
      ORIENTATION_OPTIONS.has(orientationRaw)
        ? (orientationRaw as "default" | "align_image")
        : "align_image";

    const uploadBlob = await toUploadBlob(image);
    const uploadFile = new File([uploadBlob], image.name || "upload.jpg", {
      type: mimeType,
    });
    const imageUrl = await fal.storage.upload(uploadFile);

    const { request_id: requestId } = await fal.queue.submit(TRIPO_ENDPOINT, {
      input: {
        image_url: imageUrl,
        texture,
        quad,
        orientation,
      },
    });

    return NextResponse.json({
      requestId,
      format: quad ? "fbx" : "glb",
    });
  } catch (error) {
    console.error("[api/generate]", error);

    return NextResponse.json({ error: API_ERROR_RESPONSE }, { status: 500 });
  }
}
