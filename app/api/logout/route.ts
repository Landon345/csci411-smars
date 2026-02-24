import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const session = await getSession();
  await writeAuditLog({ userId: session?.UserID, action: "logout", ipAddress: ip });

  const cookieStore = await cookies();

  // Clear the cookie by setting its expiration to the past
  cookieStore.set("auth_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return NextResponse.json(
    { message: "Logged out successfully" },
    { status: 200 },
  );
}
