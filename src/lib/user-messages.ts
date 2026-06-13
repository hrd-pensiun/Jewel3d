export const USER_MESSAGES = {
  genericError: "Terjadi kesalahan. Silakan coba lagi.",
  generateFailed: "Gagal membuat model 3D. Silakan coba lagi.",
  uploadFailed: "Gagal mengunggah gambar. Silakan coba lagi.",
  processingTimeout:
    "Proses masih berjalan. Silakan tunggu sebentar lalu coba refresh halaman.",
  uploading: "Mengunggah gambar…",
  accepted: "Permintaan diterima. Sedang diproses…",
  queue: "Menunggu antrian…",
  queuePosition: (position: number) => `Menunggu antrian… posisi ${position}`,
  generating: "Sedang membuat model 3D… (±30–60 detik)",
  resuming: "Melanjutkan proses yang sedang berjalan…",
};

const SAFE_USER_ERRORS = [
  /^File gambar wajib/i,
  /^Format /i,
  /^Ukuran gambar/i,
  /^File gambar kosong/i,
  /^Opsi tekstur/i,
  /^Terlalu banyak permintaan/i,
  /^Format HEIC/i,
  /^Format harus/i,
];

export function toUserError(message?: string | null): string {
  if (!message) return USER_MESSAGES.genericError;

  const trimmed = message.trim();
  if (SAFE_USER_ERRORS.some((pattern) => pattern.test(trimmed))) {
    return trimmed;
  }

  return USER_MESSAGES.genericError;
}

export const API_ERROR_RESPONSE = USER_MESSAGES.genericError;
