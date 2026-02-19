import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.appointment.findUnique({
    where: { AppointmentID: id },
  });
  if (!existing || existing.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { date, startTime, endTime, place, reason, type, status, notes, canceledBy, visitSummary } = body;

  const data: Record<string, unknown> = {};
  if (date) data.Date = new Date(date);
  if (startTime) data.StartTime = new Date(`1970-01-01T${startTime}:00`);
  if (endTime) data.EndTime = new Date(`1970-01-01T${endTime}:00`);
  if (place) data.Place = place;
  if (reason) data.Reason = reason;
  if (type) data.Type = type;
  if (status) data.Status = status;
  if (notes !== undefined) data.Notes = notes || null;
  if (canceledBy !== undefined) data.CanceledBy = canceledBy || null;
  if (visitSummary !== undefined) data.VisitSummary = visitSummary || null;

  const appointment = await prisma.appointment.update({
    where: { AppointmentID: id },
    data,
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
  });

  if (status === "completed" && visitSummary) {
    const existingRecord = await prisma.medicalRecord.findFirst({
      where: { AppointmentID: id },
    });
    if (!existingRecord) {
      await prisma.medicalRecord.create({
        data: {
          DoctorID: user.UserID,
          PatientID: existing.PatientID,
          AppointmentID: id,
          VisitDate: existing.Date,
          ChiefComplaint: existing.Reason,
          DiagnosisCode: "N/A",
          DiagnosisDesc: "See visit summary",
          TreatmentPlan: visitSummary,
          Type: "office_visit",
        },
      });
    }
  }

  return NextResponse.json({ appointment });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.appointment.findUnique({
    where: { AppointmentID: id },
  });
  if (!existing || existing.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.appointment.delete({ where: { AppointmentID: id } });

  return NextResponse.json({ success: true });
}
