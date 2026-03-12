import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPresignedUploadUrl, S3_BUCKET } from "@/lib/s3";

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/png": "png",
  "image/jpeg": "jpg",
};

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: recordId } = await params;

  const record = await prisma.medicalRecord.findUnique({
    where: { RecordID: recordId },
    select: { DoctorID: true },
  });
  if (!record || record.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const { contentType, sizeBytes, fileName } = await req.json();

  const ext = ALLOWED_TYPES[contentType as string];
  if (!ext) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG" },
      { status: 400 }
    );
  }
  if (typeof sizeBytes !== "number" || sizeBytes <= 0 || sizeBytes > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be between 1 byte and 20 MB" },
      { status: 400 }
    );
  }
  if (!fileName || typeof fileName !== "string") {
    return NextResponse.json({ error: "fileName is required" }, { status: 400 });
  }

  const key = `record-documents/${recordId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const uploadUrl = await getPresignedUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key, bucket: S3_BUCKET });
}
