import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const patients = await prisma.user.findMany({
    where: { Role: "patient" },
    select: {
      UserID: true,
      FirstName: true,
      LastName: true,
    },
    orderBy: { LastName: "asc" },
  });

  return NextResponse.json({ patients });
}
