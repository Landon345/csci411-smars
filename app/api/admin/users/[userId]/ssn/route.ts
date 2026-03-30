import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { decryptSSN } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/auditLog";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const admin = await getSession();
  if (!admin || admin.Role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { UserID: userId },
    select: { SSN: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const digits = decryptSSN(user.SSN);
  const formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;

  writeAuditLog({
    userId: admin.UserID,
    action: "ssn_viewed",
    ipAddress: ip,
    details: { viewedUserId: userId },
  });

  return NextResponse.json({ ssn: formatted });
}
