import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    // Always return success to prevent email enumeration
    const successResponse = NextResponse.json(
      { message: "If an account exists with that email, a reset link has been sent." },
      { status: 200 },
    );

    const user = await prisma.user.findUnique({ where: { Email: email } });
    if (!user) {
      return successResponse;
    }

    // Generate secure reset token and 15-minute expiry
    const resetToken = crypto.randomUUID();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { UserID: user.UserID },
      data: {
        ResetToken: resetToken,
        ResetExpires: resetExpires,
      },
    });

    // Send email in production, log in development
    if (process.env.NODE_ENV === "production") {
      const resetUrl = `${request.headers.get("origin")}/reset-password?token=${resetToken}`;
      await resend.emails.send({
        from: "Smars <onboarding@resend.dev>",
        to: email,
        subject: "Reset your Smars Password",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h1>Password Reset</h1>
            <p>You requested a password reset for your S.M.A.R.S account.</p>
            <p>Click the link below to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #18181b; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 20px 0;">
              Reset Password
            </a>
            <p>This link will expire in 15 minutes.</p>
            <p>If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log("--- DEVELOPMENT MODE: PASSWORD RESET ---");
      console.log(`Reset token for ${email}: ${resetToken}`);
      console.log(`Reset link: /reset-password?token=${resetToken}`);
      console.log("-----------------------------------------");
    }

    return successResponse;
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
