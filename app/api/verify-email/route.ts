import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    // 1. Get the current user from the session
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await decrypt(token);
    if (!session?.user?.Email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 2. Find the user in the DB
    const user = await prisma.user.findUnique({
      where: { Email: session.user.Email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Validate the Code
    if (user.VerifyCode !== code) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 },
      );
    }

    // 4. Validate Expiration
    if (!user.VerifyExpires || new Date() > user.VerifyExpires) {
      return NextResponse.json(
        { error: "Code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // 5. Success: Mark as verified and clear the code
    await prisma.user.update({
      where: { UserID: user.UserID },
      data: {
        EmailVerified: new Date(),
        VerifyCode: null, // Clear code so it can't be reused
        VerifyExpires: null,
      },
    });

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 },
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
