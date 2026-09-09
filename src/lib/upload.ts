"use client";

import { upload } from "@vercel/blob/client";

import {
  ALLOWED_CONTENT_TYPES,
  type AttachmentInput,
  MAX_UPLOAD_BYTES,
} from "@/lib/contracts/attachments";

export class UploadError extends Error {}

/** Read an image's natural size so the UI can reserve space before it loads. */
async function imageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

/** Upload one file straight to Blob and return the metadata to attach. */
export async function uploadFile(file: File): Promise<AttachmentInput> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError(`${file.name} is larger than 15 MB.`);
  }
  if (file.type && !ALLOWED_CONTENT_TYPES.includes(file.type)) {
    throw new UploadError(`${file.name}: that file type isn't allowed.`);
  }

  const size = await imageSize(file);

  let blob;
  try {
    blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/uploads",
      contentType: file.type || undefined,
    });
  } catch (err) {
    throw new UploadError(
      err instanceof Error ? err.message : "Upload failed. Try again.",
    );
  }

  return {
    url: blob.url,
    pathname: blob.pathname,
    name: file.name,
    width: size?.width,
    height: size?.height,
  };
}
