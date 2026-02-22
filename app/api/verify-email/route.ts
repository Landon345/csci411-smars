import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt, login } from "@/lib/auth";

const MAX_ATTEMPTS = 5;

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

    // 3. Check attempt limit
    if (user.VerifyAttempts >= MAX_ATTEMPTS) {
      // Clear the code so they must request a new one
      await prisma.user.update({
        where: { UserID: user.UserID },
        data: { VerifyCode: null, VerifyExpires: null },
      });
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
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

    // 5. Validate the Code
    if (user.VerifyCode !== code) {
      await prisma.user.update({
        where: { UserID: user.UserID },
        data: { VerifyAttempts: { increment: 1 } },
      });
      const remaining = MAX_ATTEMPTS - (user.VerifyAttempts + 1);
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Invalid verification code. No attempts remaining — please request a new code.",
        },
        { status: 400 },
      );
    }

    // 6. Success: mark as verified, clear the code, reset attempts
    await prisma.user.update({
      where: { UserID: user.UserID },
      data: {
        EmailVerified: new Date(),
        VerifyCode: null,
        VerifyExpires: null,
        VerifyAttempts: 0,
      },
    });

    // 7. Re-issue the JWT with emailVerified: true
    await login({
      UserID: user.UserID,
      Email: user.Email,
      FirstName: user.FirstName,
      LastName: user.LastName,
      Role: user.Role as "patient" | "doctor" | "admin",
      emailVerified: true,
    });

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
