import {
  IMAGE_COMPRESS_QUALITY,
  IMAGE_MAX_SIDE_PX,
  IMAGE_SKIP_COMPRESS_BYTES,
} from "@/lib/mediaLimits";

function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Compress a student photo for Storage: shrink long side, WebP (or JPEG fallback).
 * Keeps quality high enough for readable homework photos.
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!isImageFile(file)) return file;
  if (file.size > 0 && file.size <= IMAGE_SKIP_COMPRESS_BYTES) return file;

  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(
    1,
    IMAGE_MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, "image/webp", IMAGE_COMPRESS_QUALITY);
  let outType = "image/webp";
  let outExt = "webp";

  if (!blob) {
    blob = await canvasToBlob(canvas, "image/jpeg", IMAGE_COMPRESS_QUALITY);
    outType = "image/jpeg";
    outExt = "jpg";
  }

  if (!blob || blob.size === 0) return file;

  // Keep original if compression did not help
  if (blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.${outExt}`, {
    type: outType,
    lastModified: Date.now(),
  });
}

export function isCompressibleImage(file: File): boolean {
  return isImageFile(file);
}
