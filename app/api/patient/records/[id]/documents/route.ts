import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { writeAuditLog } from "@/lib/auditLog";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: recordId } = await params;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Verify this record belongs to the patient
  const record = await prisma.medicalRecord.findUnique({
    where: { RecordID: recordId },
    select: { PatientID: true },
  });
  if (!record || record.PatientID !== user.UserID) {
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
