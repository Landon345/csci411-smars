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

  const existing = await prisma.prescription.findUnique({
    where: { PrescriptionID: id },
  });
  if (!existing || existing.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    medication,
    dosage,
    frequency,
    duration,
    startDate,
    endDate,
    refills,
    status,
    notes,
  } = body;

  const data: Record<string, unknown> = {};
  if (medication) data.Medication = medication;
  if (dosage) data.Dosage = dosage;
  if (frequency) data.Frequency = frequency;
  if (duration) data.Duration = duration;
  if (startDate) data.StartDate = new Date(startDate);
  if (endDate !== undefined) data.EndDate = endDate ? new Date(endDate) : null;
  if (refills !== undefined) data.Refills = refills ? parseInt(refills) : 0;
  if (status) data.Status = status;
  if (notes !== undefined) data.Notes = notes || null;

  const prescription = await prisma.prescription.update({
    where: { PrescriptionID: id },
    data,
    include: {
      Patient: {
        select: { FirstName: true, LastName: true },
      },
    },
  });

  return NextResponse.json({ prescription });
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

  const existing = await prisma.prescription.findUnique({
    where: { PrescriptionID: id },
  });
  if (!existing || existing.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.prescription.delete({ where: { PrescriptionID: id } });

  return NextResponse.json({ success: true });
}
