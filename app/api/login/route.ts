import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { Resend } from "resend";
import { writeAuditLog } from "@/lib/auditLog";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    const { email, password } = await request.json();

    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { Email: email },
    });

    if (!user || !user.Password) {
      // Count this as a failed attempt for rate limiting
      if (!rateLimit(ip, "login", 5, 60 * 1000)) {
        return NextResponse.json(
          { error: "Too many failed login attempts. Try again in a minute." },
          { status: 429 },
        );
      }
      await writeAuditLog({ action: "login_failure", ipAddress: ip, details: { email } });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      if (!rateLimit(ip, "login", 5, 60 * 1000)) {
        return NextResponse.json(
          { error: "Too many failed login attempts. Try again in a minute." },
          { status: 429 },
        );
      }
      await writeAuditLog({ action: "login_failure", ipAddress: ip, details: { email } });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 3. If email is not verified, issue a partial JWT and send a fresh OTP
    if (!user.EmailVerified) {
      const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verifyExpires = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { UserID: user.UserID },
        data: {
          VerifyCode: verifyCode,
          VerifyExpires: verifyExpires,
          VerifyAttempts: 0,
        },
      });

      if (process.env.NODE_ENV === "production") {
        await resend.emails.send({
          from: "Smars <onboarding@resend.dev>",
          to: user.Email,
          subject: "Verify your Smars Account",
          html: `
            <div style="font-family: sans-serif; padding: 20px;">
              <h1>Welcome back, ${user.FirstName}!</h1>
              <p>Please verify your email to continue:</p>
              <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0;">
                ${verifyCode}
              </div>
              <p>This code will expire in 15 minutes.</p>
            </div>
          `,
        });
      } else {
        console.log("--- DEVELOPMENT MODE: EMAIL LOG ---");
        console.log(`Verification code for ${user.Email}: ${verifyCode}`);
        console.log("-----------------------------------");
      }

      await login({
        UserID: user.UserID,
        Email: user.Email,
        FirstName: user.FirstName,
        LastName: user.LastName,
        Role: user.Role as "patient" | "doctor" | "admin",
        emailVerified: false,
      });

      // proxy.ts will redirect to /verify-email for any protected route access
      return NextResponse.json({ success: true });
    }

    // 4. Fully verified — issue a full session
    await login({
      UserID: user.UserID,
      Email: user.Email,
      FirstName: user.FirstName,
      LastName: user.LastName,
      Role: user.Role as "patient" | "doctor" | "admin",
      emailVerified: true,
    });

    await writeAuditLog({ userId: user.UserID, action: "login_success", ipAddress: ip });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
