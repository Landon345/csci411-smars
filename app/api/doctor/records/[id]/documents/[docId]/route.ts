import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { deleteS3Object } from "@/lib/s3";
import { writeAuditLog } from "@/lib/auditLog";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: recordId, docId } = await params;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Verify the record belongs to this doctor
  const record = await prisma.medicalRecord.findUnique({
    where: { RecordID: recordId },
    select: { DoctorID: true },
  });
  if (!record || record.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const doc = await prisma.recordDocument.findUnique({
    where: { DocumentID: docId },
  });
  if (!doc || doc.RecordID !== recordId) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await Promise.all([
    deleteS3Object(doc.S3Key),
    prisma.recordDocument.delete({ where: { DocumentID: docId } }),
  ]);

  await writeAuditLog({
    userId: user.UserID,
    action: "document_deleted",
    ipAddress: ip,
    details: { documentId: docId, recordId, fileName: doc.FileName },
  });

  return NextResponse.json({ success: true });
}
