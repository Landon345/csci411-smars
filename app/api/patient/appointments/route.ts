import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { PatientID: user.UserID },
    include: {
      Doctor: {
        select: { FirstName: true, LastName: true },
      },
    },
    orderBy: { Date: "desc" },
  });

  return NextResponse.json({ appointments });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { doctorId, date, startTime, reason, type } = body;

  if (!doctorId || !date || !startTime || !reason) {
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

  const doctor = await prisma.user.findFirst({
    where: { UserID: doctorId, Role: "doctor" },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
  }

  // EndTime = startTime + 30 minutes
  const startDate = new Date(`1970-01-01T${startTime}:00`);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const appointment = await prisma.appointment.create({
    data: {
      DoctorID: doctorId,
      PatientID: user.UserID,
      Date: new Date(date),
      StartTime: startDate,
      EndTime: endDate,
      Place: "TBD",
      Reason: reason,
      Type: type || "checkup",
      Status: "pending",
    },
    include: {
      Doctor: {
        select: { FirstName: true, LastName: true },
      },
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
