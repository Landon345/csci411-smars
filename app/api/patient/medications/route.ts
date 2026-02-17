import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const prescriptions = await prisma.prescription.findMany({
    where: { PatientID: user.UserID },
    include: {
      Doctor: {
        select: { FirstName: true, LastName: true },
      },
    },
    orderBy: { StartDate: "desc" },
  });

  return NextResponse.json({ prescriptions });
}
