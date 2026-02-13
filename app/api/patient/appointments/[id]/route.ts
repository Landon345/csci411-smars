import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.appointment.findUnique({
    where: { AppointmentID: id },
  });
  if (!existing || existing.PatientID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.Status !== "scheduled" && existing.Status !== "pending") {
    return NextResponse.json(
      { error: "Can only cancel scheduled or pending appointments" },
      { status: 400 },
    );
  }

  const appointment = await prisma.appointment.update({
    where: { AppointmentID: id },
    data: {
      Status: "canceled",
      CanceledBy: `${user.FirstName} ${user.LastName}`,
    },
    include: {
      Doctor: {
        select: { FirstName: true, LastName: true },
      },
    },
  });

  return NextResponse.json({ appointment });
}
