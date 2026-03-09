import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { AllergySeverity } from "@/generated/prisma/client";

const VALID_SEVERITIES = Object.values(AllergySeverity);

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const allergies = await prisma.allergy.findMany({
    where: { PatientID: user.UserID },
    orderBy: { CreatedAt: "desc" },
  });

  return NextResponse.json({ allergies });
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { Name, Severity, Reaction } = body;

  if (!Name || typeof Name !== "string" || Name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!Severity || !VALID_SEVERITIES.includes(Severity)) {
    return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
  }

  const allergy = await prisma.allergy.create({
    data: {
      PatientID: user.UserID,
      Name: Name.trim(),
      Severity,
      Reaction: Reaction?.trim() || null,
    },
  });

  return NextResponse.json({ allergy }, { status: 201 });
}
