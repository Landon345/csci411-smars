import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ClinicalCategory, MedicalDegree } from "@/generated/prisma/client";

const VALID_CATEGORIES = Object.values(ClinicalCategory) as string[];
const VALID_DEGREES = Object.values(MedicalDegree) as string[];

export async function GET() {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const profile = await prisma.doctorProfile.upsert({
    where: { UserID: user.UserID },
    update: {},
    create: { UserID: user.UserID, SubSpecialties: [] },
  });

  return NextResponse.json({ profile });
}

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const {
    ClinicalCategory: category,
    Specialty,
    Degree,
    BoardCertified,
    SubSpecialties,
    Bio,
    Telehealth,
  } = body;

  if (category !== undefined && category !== null && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid ClinicalCategory" }, { status: 400 });
  }
  if (Degree !== undefined && Degree !== null && !VALID_DEGREES.includes(Degree)) {
    return NextResponse.json({ error: "Invalid Degree" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (category !== undefined) updateData.ClinicalCategory = category || null;
  if (Specialty !== undefined) updateData.Specialty = Specialty || null;
  if (Degree !== undefined) updateData.Degree = Degree || null;
  if (BoardCertified !== undefined) updateData.BoardCertified = BoardCertified;
  if (SubSpecialties !== undefined) updateData.SubSpecialties = SubSpecialties;
  if (Bio !== undefined) updateData.Bio = Bio || null;
  if (Telehealth !== undefined) updateData.Telehealth = Telehealth;

  const profile = await prisma.doctorProfile.upsert({
    where: { UserID: user.UserID },
    update: updateData,
    create: {
      UserID: user.UserID,
      SubSpecialties: [],
      ...updateData,
    },
  });

  return NextResponse.json({ profile });
}
