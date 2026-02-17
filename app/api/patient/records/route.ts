import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const records = await prisma.medicalRecord.findMany({
    where: { PatientID: user.UserID },
    include: {
      Doctor: {
        select: { FirstName: true, LastName: true },
      },
    },
    orderBy: { VisitDate: "desc" },
  });

  return NextResponse.json({ records });
}
