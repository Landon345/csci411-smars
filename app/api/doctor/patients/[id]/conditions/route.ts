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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: patientId } = await params;

  const body = await request.json();
  const { Name } = body;

  if (!Name || typeof Name !== "string" || Name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const condition = await prisma.$transaction(async (tx) => {
    const patient = await tx.user.findFirst({
      where: RELATIONSHIP_WHERE(user.UserID, patientId),
      select: { UserID: true },
    });
    if (!patient) return null;

    return tx.chronicCondition.create({
      data: { PatientID: patientId, Name: Name.trim() },
    });
  });

  if (!condition) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({ condition }, { status: 201 });
}
