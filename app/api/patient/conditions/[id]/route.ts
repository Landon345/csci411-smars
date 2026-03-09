import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const condition = await prisma.chronicCondition.findUnique({
    where: { ConditionID: id },
  });
  if (!condition || condition.PatientID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.chronicCondition.delete({ where: { ConditionID: id } });
  return new NextResponse(null, { status: 204 });
}
