import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const patient = await prisma.user.findFirst({
    where: {
      UserID: id,
      Role: "patient",
      OR: [
        { PatientAppointments: { some: { DoctorID: user.UserID } } },
        { PatientRecords: { some: { DoctorID: user.UserID } } },
      ],
    },
    select: {
      UserID: true,
      FirstName: true,
      LastName: true,
      Email: true,
      Phone: true,
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({ patient });
}
