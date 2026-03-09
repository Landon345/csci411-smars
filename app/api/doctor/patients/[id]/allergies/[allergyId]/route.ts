import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const RELATIONSHIP_WHERE = (doctorId: string, patientId: string) => ({
  UserID: patientId,
  Role: "patient" as const,
  OR: [
    { PatientAppointments: { some: { DoctorID: doctorId } } },
    { PatientRecords: { some: { DoctorID: doctorId } } },
  ],
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; allergyId: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: patientId, allergyId } = await params;

  const deleted = await prisma.$transaction(async (tx) => {
    const patient = await tx.user.findFirst({
      where: RELATIONSHIP_WHERE(user.UserID, patientId),
      select: { UserID: true },
    });
    if (!patient) return null;

    const allergy = await tx.allergy.findUnique({
      where: { AllergyID: allergyId },
      select: { PatientID: true },
    });
    if (!allergy || allergy.PatientID !== patientId) return null;

    return tx.allergy.delete({ where: { AllergyID: allergyId } });
  });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
