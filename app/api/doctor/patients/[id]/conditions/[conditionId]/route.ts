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
  { params }: { params: Promise<{ id: string; conditionId: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: patientId, conditionId } = await params;

  const deleted = await prisma.$transaction(async (tx) => {
    const patient = await tx.user.findFirst({
      where: RELATIONSHIP_WHERE(user.UserID, patientId),
      select: { UserID: true },
    });
    if (!patient) return null;

    const condition = await tx.chronicCondition.findUnique({
      where: { ConditionID: conditionId },
      select: { PatientID: true },
    });
    if (!condition || condition.PatientID !== patientId) return null;

    return tx.chronicCondition.delete({ where: { ConditionID: conditionId } });
  });

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
