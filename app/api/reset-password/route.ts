import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: { ResetToken: token },
    });

    if (!user || !user.ResetExpires || user.ResetExpires < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    // Hash new password and clear reset token
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { UserID: user.UserID },
      data: {
        Password: hashedPassword,
        ResetToken: null,
        ResetExpires: null,
      },
    });

    // Invalidate all existing sessions for this user
    await prisma.session.deleteMany({
      where: { UserID: user.UserID },
    });

    // Clear the auth cookie on the response
    const response = NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 },
    );

    response.cookies.set("auth_token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
