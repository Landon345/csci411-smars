import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl, deleteS3Object, S3_BUCKET } from "@/lib/s3";

/** GET — return a presigned view URL for the current user's photo, or null. */
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photo = await prisma.profilePhoto.findUnique({ where: { UserID: user.UserID } });
  if (!photo) return NextResponse.json({ viewUrl: null });

  const viewUrl = await getPresignedDownloadUrl(photo.S3Key);
  return NextResponse.json({ viewUrl });
}

/** POST — save metadata after a successful S3 upload; deletes previous S3 object. */
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key, contentType, sizeBytes } = await req.json();
  if (!key || !contentType || typeof sizeBytes !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Delete old S3 object if the key changed
  const existing = await prisma.profilePhoto.findUnique({ where: { UserID: user.UserID } });
  if (existing && existing.S3Key !== key) {
    await deleteS3Object(existing.S3Key);
  }

  const photo = await prisma.profilePhoto.upsert({
    where: { UserID: user.UserID },
    update: { S3Key: key, S3Bucket: S3_BUCKET, ContentType: contentType, SizeBytes: sizeBytes },
    create: {
      UserID: user.UserID,
      S3Key: key,
      S3Bucket: S3_BUCKET,
      ContentType: contentType,
      SizeBytes: sizeBytes,
    },
  });

  const viewUrl = await getPresignedDownloadUrl(photo.S3Key);
  return NextResponse.json({ viewUrl });
}

/** DELETE — remove the photo from S3 and the database. */
export async function DELETE() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const photo = await prisma.profilePhoto.findUnique({ where: { UserID: user.UserID } });
  if (!photo) return NextResponse.json({ success: true });

  await Promise.all([
    deleteS3Object(photo.S3Key),
    prisma.profilePhoto.delete({ where: { UserID: user.UserID } }),
  ]);

  return NextResponse.json({ success: true });
}
