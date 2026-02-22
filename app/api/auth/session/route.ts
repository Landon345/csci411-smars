import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await decrypt(token);
    // payload.exp is a Unix timestamp in seconds (set by jose's setExpirationTime)
    return NextResponse.json({ expiresAt: payload.exp * 1000 });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
