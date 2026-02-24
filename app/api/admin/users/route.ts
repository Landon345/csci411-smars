import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

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

export async function PATCH(request: NextRequest) {
  const user = await getSession();
  if (!user || user.Role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { userId, newRole } = await request.json();

  const validRoles = ["patient", "doctor", "admin"];
  if (!validRoles.includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  await prisma.user.update({
    where: { UserID: userId },
    data: { Role: newRole },
  });

  await writeAuditLog({
    userId: user.UserID,
    action: "role_changed",
    ipAddress: ip,
    details: { targetUserId: userId, newRole },
  });

  return NextResponse.json({ success: true });
}
