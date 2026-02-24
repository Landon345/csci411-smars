import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { id } = await params;

  const existing = await prisma.medicalRecord.findUnique({
    where: { RecordID: id },
  });
  if (!existing || existing.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    visitDate,
    chiefComplaint,
    diagnosisCode,
    diagnosisDesc,
    treatmentPlan,
    heartRate,
    bloodPressure,
    temperature,
    weight,
    height,
    followUp,
    type,
  } = body;

  const data: Record<string, unknown> = {};
  if (visitDate) data.VisitDate = new Date(visitDate);
  if (chiefComplaint) data.ChiefComplaint = chiefComplaint;
  if (diagnosisCode) data.DiagnosisCode = diagnosisCode;
  if (diagnosisDesc) data.DiagnosisDesc = diagnosisDesc;
  if (treatmentPlan) data.TreatmentPlan = treatmentPlan;
  if (heartRate !== undefined)
    data.HeartRate = heartRate ? parseInt(heartRate) : null;
  if (bloodPressure !== undefined)
    data.BloodPressure = bloodPressure || null;
  if (temperature !== undefined)
    data.Temperature = temperature ? parseFloat(temperature) : null;
  if (weight !== undefined)
    data.Weight = weight ? parseFloat(weight) : null;
  if (height !== undefined)
    data.Height = height ? parseFloat(height) : null;
  if (followUp !== undefined) data.FollowUp = followUp || null;
  if (type) data.Type = type;

  const record = await prisma.medicalRecord.update({
    where: { RecordID: id },
    data,
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
  });

  await writeAuditLog({
    userId: user.UserID,
    action: "record_updated",
    ipAddress: ip,
    details: { recordId: id },
  });

  return NextResponse.json({ record });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.medicalRecord.findUnique({
    where: { RecordID: id },
  });
  if (!existing || existing.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.medicalRecord.delete({ where: { RecordID: id } });

  return NextResponse.json({ success: true });
}
