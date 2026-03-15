import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      UserID: true,
      FirstName: true,
      LastName: true,
      Email: true,
      Role: true,
      CreatedAt: true,
    },
    orderBy: { CreatedAt: "desc" },
  });

  return NextResponse.json({ users });
}

