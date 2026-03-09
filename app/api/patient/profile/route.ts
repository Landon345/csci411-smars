import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { BloodType } from "@/generated/prisma/client";

const VALID_BLOOD_TYPES = Object.values(BloodType);

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const profile = await prisma.patientProfile.upsert({
    where: { UserID: user.UserID },
    update: {},
    create: { UserID: user.UserID },
    include: {
      PrimaryCarePhysician: { select: { FirstName: true, LastName: true } },
    },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

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

  if (bloodType !== undefined && bloodType !== null && !VALID_BLOOD_TYPES.includes(bloodType)) {
    return NextResponse.json({ error: "Invalid blood type" }, { status: 400 });
  }

  const profile = await prisma.patientProfile.upsert({
    where: { UserID: user.UserID },
    update: {
      BloodType: bloodType ?? null,
      InsuranceProvider: InsuranceProvider ?? null,
      InsurancePolicyNumber: InsurancePolicyNumber ?? null,
      EmergencyContactName: EmergencyContactName ?? null,
      EmergencyContactPhone: EmergencyContactPhone ?? null,
      EmergencyContactRelationship: EmergencyContactRelationship ?? null,
      PrimaryCarePhysicianID: PrimaryCarePhysicianID ?? null,
    },
    create: {
      UserID: user.UserID,
      BloodType: bloodType ?? null,
      InsuranceProvider: InsuranceProvider ?? null,
      InsurancePolicyNumber: InsurancePolicyNumber ?? null,
      EmergencyContactName: EmergencyContactName ?? null,
      EmergencyContactPhone: EmergencyContactPhone ?? null,
      EmergencyContactRelationship: EmergencyContactRelationship ?? null,
      PrimaryCarePhysicianID: PrimaryCarePhysicianID ?? null,
    },
    include: {
      PrimaryCarePhysician: { select: { FirstName: true, LastName: true } },
    },
  });

  return NextResponse.json({ profile });
}
