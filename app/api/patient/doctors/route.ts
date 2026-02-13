import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const doctors = await prisma.user.findMany({
    where: { Role: "doctor" },
    select: {
      UserID: true,
      FirstName: true,
      LastName: true,
    },
    orderBy: { LastName: "asc" },
  });

  return NextResponse.json({ doctors });
}
