import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const records = await prisma.medicalRecord.findMany({
    where: { PatientID: user.UserID },
    include: {
      Doctor: {
        select: { FirstName: true, LastName: true },
      },
      Appointment: {
        select: { Date: true, Type: true, Reason: true },
      },
    },
    orderBy: { VisitDate: "desc" },
  });

  await writeAuditLog({ userId: user.UserID, action: "record_viewed", ipAddress: ip });

  return NextResponse.json({ records });
}
