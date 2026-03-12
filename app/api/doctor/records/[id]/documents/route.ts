import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl, S3_BUCKET } from "@/lib/s3";
import { writeAuditLog } from "@/lib/auditLog";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: recordId } = await params;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const record = await prisma.medicalRecord.findUnique({
    where: { RecordID: recordId },
    select: { DoctorID: true },
  });
  if (!record || record.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const docs = await prisma.recordDocument.findMany({
    where: { RecordID: recordId },
    orderBy: { UploadedAt: "asc" },
  });

  const docsWithUrls = await Promise.all(
    docs.map(async (d) => ({
      DocumentID: d.DocumentID,
      FileName: d.FileName,
      ContentType: d.ContentType,
      SizeBytes: d.SizeBytes,
      UploadedAt: d.UploadedAt,
      downloadUrl: await getPresignedDownloadUrl(d.S3Key).catch(() => null),
    }))
  );

  await writeAuditLog({
    userId: user.UserID,
    action: "record_viewed",
    ipAddress: ip,
    details: { recordId, context: "documents" },
  });

  return NextResponse.json({ documents: docsWithUrls });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: recordId } = await params;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const record = await prisma.medicalRecord.findUnique({
    where: { RecordID: recordId },
    select: { DoctorID: true },
  });
  if (!record || record.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const { key, fileName, contentType, sizeBytes } = await req.json();
  if (!key || !fileName || !contentType || typeof sizeBytes !== "number") {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const doc = await prisma.recordDocument.create({
    data: {
      RecordID: recordId,
      UploadedBy: user.UserID,
      S3Key: key,
      S3Bucket: S3_BUCKET,
      FileName: fileName,
      ContentType: contentType,
      SizeBytes: sizeBytes,
    },
  });

  await writeAuditLog({
    userId: user.UserID,
    action: "document_uploaded",
    ipAddress: ip,
    details: { documentId: doc.DocumentID, recordId, fileName },
  });

  const downloadUrl = await getPresignedDownloadUrl(doc.S3Key).catch(() => null);

  return NextResponse.json(
    {
      document: {
        DocumentID: doc.DocumentID,
        FileName: doc.FileName,
        ContentType: doc.ContentType,
        SizeBytes: doc.SizeBytes,
        UploadedAt: doc.UploadedAt,
        downloadUrl,
      },
    },
    { status: 201 }
  );
}
