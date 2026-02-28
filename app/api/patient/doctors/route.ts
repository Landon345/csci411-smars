import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ClinicalCategory } from "@/generated/prisma/client";

const VALID_CATEGORIES = Object.values(ClinicalCategory) as string[];

export async function GET(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = { Role: "doctor" };
  if (category && VALID_CATEGORIES.includes(category)) {
    where.DoctorProfile = { ClinicalCategory: category };
  }

  const doctors = await prisma.user.findMany({
    where,
    select: {
      UserID: true,
      FirstName: true,
      LastName: true,
      DoctorProfile: true,
    },
    orderBy: { LastName: "asc" },
  });

  return NextResponse.json({ doctors });
}
