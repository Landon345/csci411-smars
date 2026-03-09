import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const doctors = await prisma.user.findMany({
    where: { Role: "doctor" },
    select: { UserID: true, FirstName: true, LastName: true },
    orderBy: [{ LastName: "asc" }, { FirstName: "asc" }],
  });

  return NextResponse.json({ doctors });
}
