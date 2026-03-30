import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> },
) {
  const admin = await getSession();
  if (!admin || admin.Role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { patientId } = await params;
  const { doctorId } = await request.json() as { doctorId: string | null };

  // Verify patient exists and is actually a patient
  const patient = await prisma.user.findUnique({
    where: { UserID: patientId, Role: "patient" },
    select: { UserID: true, FirstName: true, LastName: true },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  // Verify doctor exists and is actually a doctor (unless removing PCP)
  if (doctorId !== null) {
    const doctor = await prisma.user.findUnique({
      where: { UserID: doctorId, Role: "doctor" },
      select: { UserID: true },
    });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
  }

  // Upsert PatientProfile with new PCP
  const profile = await prisma.patientProfile.upsert({
    where: { UserID: patientId },
    create: { UserID: patientId, PrimaryCarePhysicianID: doctorId },
    update: { PrimaryCarePhysicianID: doctorId },
    select: {
      PrimaryCarePhysicianID: true,
      PrimaryCarePhysician: { select: { FirstName: true, LastName: true } },
    },
  });

  writeAuditLog({
    userId: admin.UserID,
    action: "pcp_assigned",
    ipAddress: ip,
    details: {
      patientId,
      doctorId: doctorId ?? null,
      assignedBy: admin.UserID,
    },
  });

  return NextResponse.json({ profile });
}
