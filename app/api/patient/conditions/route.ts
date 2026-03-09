import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const conditions = await prisma.chronicCondition.findMany({
    where: { PatientID: user.UserID },
    orderBy: { CreatedAt: "desc" },
  });

  return NextResponse.json({ conditions });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { Name } = body;

  if (!Name || typeof Name !== "string" || Name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const condition = await prisma.chronicCondition.create({
    data: {
      PatientID: user.UserID,
      Name: Name.trim(),
    },
  });

  return NextResponse.json({ condition }, { status: 201 });
}
