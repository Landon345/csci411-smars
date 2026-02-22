import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt, login } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await decrypt(token);
    if (!payload?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Re-issue the JWT with a fresh 2-hour expiry
    await login({
      UserID: payload.user.UserID,
      Email: payload.user.Email,
      FirstName: payload.user.FirstName,
      LastName: payload.user.LastName,
      Role: payload.user.Role,
      emailVerified: payload.user.emailVerified,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Session refresh failed" }, { status: 401 });
  }
}
