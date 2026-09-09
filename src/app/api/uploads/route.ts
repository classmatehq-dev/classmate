import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";

import {
  ALLOWED_CONTENT_TYPES,
  MAX_UPLOAD_BYTES,
} from "@/lib/contracts/attachments";
import { blobConfigured } from "@/env";
import { getCurrentUser } from "@/server/auth/current-user";

/**
 * Client-upload token endpoint. The browser calls `upload()` from
 * `@vercel/blob/client`, which hits this route for a short-lived token,
 * then uploads the file straight to Blob (bypassing our 4.5 MB body limit).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!blobConfigured) {
    return NextResponse.json(
      { error: { code: "unavailable", message: "File uploads aren't set up yet." } },
      { status: 503 },
    );
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("You need to be signed in to upload files.");
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
      // Fires server-to-server after upload. No-op: we record the attachment
      // when the message/post/comment is created. (Also doesn't fire on localhost.)
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: "upload_failed",
          message:
            err instanceof Error ? err.message : "Upload failed. Try again.",
        },
      },
      { status: 400 },
    );
  }
}
