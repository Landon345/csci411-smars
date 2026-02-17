import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  const where: Record<string, unknown> = { DoctorID: user.UserID };
  if (patientId) where.PatientID = patientId;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
    orderBy: { Date: "desc" },
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { patientId, date, startTime, endTime, place, reason, type, notes } =
    body;

  if (!patientId || !date || !startTime || !endTime || !place || !reason) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const validTypes = [
    "checkup",
    "follow_up",
    "consultation",
    "procedure",
    "emergency",
  ];
  if (type && !validTypes.includes(type)) {
    return NextResponse.json(
      { error: "Invalid appointment type" },
      { status: 400 },
    );
  }

  const patient = await prisma.user.findFirst({
    where: { UserID: patientId, Role: "patient" },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      DoctorID: user.UserID,
      PatientID: patientId,
      Date: new Date(date),
      StartTime: new Date(`1970-01-01T${startTime}:00`),
      EndTime: new Date(`1970-01-01T${endTime}:00`),
      Place: place,
      Reason: reason,
      Type: type || "checkup",
      Notes: notes || null,
    },
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
