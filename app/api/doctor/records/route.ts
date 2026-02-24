import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  const where: Record<string, unknown> = { DoctorID: user.UserID };
  if (patientId) where.PatientID = patientId;

  const records = await prisma.medicalRecord.findMany({
    where,
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
    orderBy: { VisitDate: "desc" },
  });

  await writeAuditLog({
    userId: user.UserID,
    action: "record_viewed",
    ipAddress: ip,
    details: { patientId: patientId ?? "all" },
  });

  return NextResponse.json({ records });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const body = await request.json();
  const {
    patientId,
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

  if (
    !patientId ||
    !visitDate ||
    !chiefComplaint ||
    !diagnosisCode ||
    !diagnosisDesc ||
    !treatmentPlan
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const validTypes = [
    "office_visit",
    "lab_result",
    "imaging",
    "referral",
    "procedure_note",
  ];
  if (type && !validTypes.includes(type)) {
    return NextResponse.json(
      { error: "Invalid record type" },
      { status: 400 },
    );
  }

  const patient = await prisma.user.findFirst({
    where: { UserID: patientId, Role: "patient" },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const record = await prisma.medicalRecord.create({
    data: {
      DoctorID: user.UserID,
      PatientID: patientId,
      VisitDate: new Date(visitDate),
      ChiefComplaint: chiefComplaint,
      DiagnosisCode: diagnosisCode,
      DiagnosisDesc: diagnosisDesc,
      TreatmentPlan: treatmentPlan,
      HeartRate: heartRate ? parseInt(heartRate) : null,
      BloodPressure: bloodPressure || null,
      Temperature: temperature ? parseFloat(temperature) : null,
      Weight: weight ? parseFloat(weight) : null,
      Height: height ? parseFloat(height) : null,
      FollowUp: followUp || null,
      Type: type || "office_visit",
    },
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
  });

  await writeAuditLog({
    userId: user.UserID,
    action: "record_created",
    ipAddress: ip,
    details: { recordId: record.RecordID, patientId },
  });

  return NextResponse.json({ record }, { status: 201 });
}
