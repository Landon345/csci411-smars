import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/session";
import { getPresignedUploadUrl, S3_BUCKET } from "@/lib/s3";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contentType, sizeBytes } = await req.json();

  const ext = ALLOWED_TYPES[contentType as string];
  if (!ext) {
    return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" }, { status: 400 });
  }
  if (typeof sizeBytes !== "number" || sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
    return NextResponse.json({ error: "File must be between 1 byte and 5 MB" }, { status: 400 });
  }

  const key = `profile-photos/${user.UserID}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const uploadUrl = await getPresignedUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key, bucket: S3_BUCKET });
}
