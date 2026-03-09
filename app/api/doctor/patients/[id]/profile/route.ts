import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { BloodType } from "@/generated/prisma/client";

const VALID_BLOOD_TYPES = new Set<string>(Object.values(BloodType));

const RELATIONSHIP_WHERE = (doctorId: string, patientId: string) => ({
  UserID: patientId,
  Role: "patient" as const,
  OR: [
    { PatientAppointments: { some: { DoctorID: doctorId } } },
    { PatientRecords: { some: { DoctorID: doctorId } } },
  ],
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: patientId } = await params;

  const body = await request.json();
  const {
    BloodType: bloodType,
    InsuranceProvider,
    InsurancePolicyNumber,
    EmergencyContactName,
    EmergencyContactPhone,
    EmergencyContactRelationship,
    PrimaryCarePhysicianID,
  } = body;

  if (bloodType !== undefined && bloodType !== null && !VALID_BLOOD_TYPES.has(bloodType)) {
    return NextResponse.json({ error: "Invalid blood type" }, { status: 400 });
  }

  const profileData = {
    BloodType: bloodType ?? null,
    InsuranceProvider: InsuranceProvider ?? null,
    InsurancePolicyNumber: InsurancePolicyNumber ?? null,
    EmergencyContactName: EmergencyContactName ?? null,
    EmergencyContactPhone: EmergencyContactPhone ?? null,
    EmergencyContactRelationship: EmergencyContactRelationship ?? null,
    PrimaryCarePhysicianID: PrimaryCarePhysicianID ?? null,
  };

  const profile = await prisma.$transaction(async (tx) => {
    const patient = await tx.user.findFirst({
      where: RELATIONSHIP_WHERE(user.UserID, patientId),
      select: { UserID: true },
    });
    if (!patient) return null;

    return tx.patientProfile.upsert({
      where: { UserID: patientId },
      create: { UserID: patientId, ...profileData },
      update: profileData,
      include: {
        PrimaryCarePhysician: { select: { FirstName: true, LastName: true } },
      },
    });
  });

  if (!profile) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
