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

  const prescriptions = await prisma.prescription.findMany({
    where,
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
    orderBy: { StartDate: "desc" },
  });

  return NextResponse.json({ prescriptions });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const {
    patientId,
    medication,
    dosage,
    frequency,
    duration,
    startDate,
    endDate,
    refills,
    status,
    notes,
    recordId,
    appointmentId,
  } = body;

  if (
    !patientId ||
    !medication ||
    !dosage ||
    !frequency ||
    !duration ||
    !startDate
  ) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  const validStatuses = ["active", "completed", "discontinued"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid prescription status" },
      { status: 400 },
    );
  }

  const patient = await prisma.user.findFirst({
    where: { UserID: patientId, Role: "patient" },
  });
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const prescription = await prisma.prescription.create({
    data: {
      DoctorID: user.UserID,
      PatientID: patientId,
      Medication: medication,
      Dosage: dosage,
      Frequency: frequency,
      Duration: duration,
      StartDate: new Date(startDate),
      EndDate: endDate ? new Date(endDate) : null,
      Refills: refills ? parseInt(refills) : 0,
      Status: status || "active",
      Notes: notes || null,
      RecordID: recordId || null,
      AppointmentID: appointmentId || null,
    },
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
  });

  return NextResponse.json({ prescription }, { status: 201 });
}
