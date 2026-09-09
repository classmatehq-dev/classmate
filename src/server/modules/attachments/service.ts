import { head } from "@vercel/blob";
import { and, asc, eq, inArray } from "drizzle-orm";

import {
  ALLOWED_CONTENT_TYPES,
  type AttachmentDto,
  type AttachmentInput,
  isImageContentType,
  MAX_ATTACHMENTS_PER_ITEM,
  MAX_UPLOAD_BYTES,
} from "@/lib/contracts/attachments";
import { blobConfigured } from "@/env";
import { db } from "@/server/db";
import { attachments, type Attachment } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";

export type AttachmentOwner = "message" | "post" | "comment";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function toDto(row: Attachment): AttachmentDto {
  return {
    id: row.id,
    kind: row.kind,
    url: row.url,
    name: row.name,
    contentType: row.contentType,
    size: row.size,
    width: row.width,
    height: row.height,
  };
}

/**
 * Validate freshly-uploaded blobs and record them against a row.
 * We re-check size + content type against Blob itself (`head`) rather than
 * trusting whatever the client claimed.
 */
export async function persistAttachments(
  ownerType: AttachmentOwner,
  ownerId: string,
  uploaderId: string,
  inputs: AttachmentInput[] | undefined,
): Promise<AttachmentDto[]> {
  if (!inputs || inputs.length === 0) return [];
  if (inputs.length > MAX_ATTACHMENTS_PER_ITEM) {
    throw ApiError.validation(
      `You can attach up to ${MAX_ATTACHMENTS_PER_ITEM} files.`,
    );
  }
  if (!blobConfigured) {
    throw ApiError.validation("File uploads aren't set up on this server yet.");
  }

  const rows: (typeof attachments.$inferInsert)[] = [];
  for (const input of inputs) {
    let host: string;
    try {
      host = new URL(input.url).host;
    } catch {
      throw ApiError.validation("That file link isn't valid.");
    }
    if (!host.endsWith(BLOB_HOST_SUFFIX)) {
      throw ApiError.validation("Files must be uploaded through Classmate.");
    }

    let meta;
    try {
      meta = await head(input.url);
    } catch {
      throw ApiError.validation(
        "We couldn't find that upload. Please try attaching it again.",
      );
    }

    const contentType = meta.contentType ?? "application/octet-stream";
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw ApiError.validation(`${input.name}: that file type isn't allowed.`);
    }
    if (meta.size > MAX_UPLOAD_BYTES) {
      throw ApiError.validation(`${input.name} is larger than 15 MB.`);
    }

    rows.push({
      ownerType,
      ownerId,
      uploaderId,
      kind: isImageContentType(contentType) ? "image" : "file",
      url: input.url,
      pathname: meta.pathname ?? input.pathname,
      name: input.name,
      contentType,
      size: meta.size,
      width: input.width ?? null,
      height: input.height ?? null,
    });
  }

  const inserted = await db.insert(attachments).values(rows).returning();
  return inserted.map(toDto);
}

/** attachments for one row */
export async function listAttachmentsFor(
  ownerType: AttachmentOwner,
  ownerId: string,
): Promise<AttachmentDto[]> {
  const rows = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.ownerType, ownerType),
        eq(attachments.ownerId, ownerId),
      ),
    )
    .orderBy(asc(attachments.createdAt));
  return rows.map(toDto);
}

/** attachments for many rows at once, grouped by owner id */
export async function loadAttachmentsMap(
  ownerType: AttachmentOwner,
  ownerIds: string[],
): Promise<Map<string, AttachmentDto[]>> {
  const map = new Map<string, AttachmentDto[]>();
  if (ownerIds.length === 0) return map;

  const rows = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.ownerType, ownerType),
        inArray(attachments.ownerId, ownerIds),
      ),
    )
    .orderBy(asc(attachments.createdAt));

  for (const row of rows) {
    const list = map.get(row.ownerId) ?? [];
    list.push(toDto(row));
    map.set(row.ownerId, list);
  }
  return map;
}
