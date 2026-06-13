import { NextResponse } from "next/server";

import { fal } from "@/lib/fal";
import {
  inferImageMimeType,
  isHeicImage,
  toUploadBlob,
} from "@/lib/image-upload";
import { calculateCostUsd, type TextureOption } from "@/lib/pricing";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const TEXTURE_OPTIONS = new Set<TextureOption>(["no", "standard", "HD"]);
const ORIENTATION_OPTIONS = new Set(["default", "align_image"]);

export const maxDuration = 60;

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
    return NextResponse.json(
      { error: "FAL_KEY belum dikonfigurasi di server." },
      { status: 500 },
    );
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
      typeof textureRaw === "string" && TEXTURE_OPTIONS.has(textureRaw as TextureOption)
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

    const result = await fal.subscribe("tripo3d/tripo/v2.5/image-to-3d", {
      input: {
        image_url: imageUrl,
        texture,
        quad,
        orientation,
      },
      logs: true,
    });

    const modelUrl = result.data.model_mesh?.url;
    if (!modelUrl) {
      return NextResponse.json(
        { error: "Model 3D tidak ditemukan dalam respons API." },
        { status: 502 },
      );
    }

    const costUsd = calculateCostUsd(texture, quad);

    return NextResponse.json({
      taskId: result.data.task_id,
      modelUrl,
      previewUrl: result.data.rendered_image?.url ?? null,
      costUsd,
    });
  } catch (error) {
    console.error("[api/generate]", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error:
          message.includes("401") || message.includes("Unauthorized")
            ? "FAL_KEY tidak valid. Periksa API key di .env.local."
            : "Gagal men-generate model 3D. Periksa koneksi dan API key, lalu coba lagi.",
      },
      { status: 500 },
    );
  }
}
