import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
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
