import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login } from "@/lib/auth";
import { Resend } from "resend";
import { writeAuditLog } from "@/lib/auditLog";

const resend = new Resend(process.env.RESEND_API_KEY);

const MAX_FAILED_ATTEMPTS = 15;
const LOCKOUT_MINUTES = 10;

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
      await writeAuditLog({ action: "login_failure", ipAddress: ip, details: { email } });
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 2. Check account lockout
    if (user.LockedUntil && user.LockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.LockedUntil.getTime() - Date.now()) / 60_000,
      );
      return NextResponse.json(
        {
          error: `Account locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
          lockedUntil: user.LockedUntil!.toISOString(),
        },
        { status: 423 },
      );
    }

    // 3. Check password
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      const newFailedAttempts = user.FailedAttempts + 1;

      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60_000);

        await prisma.user.update({
          where: { UserID: user.UserID },
          data: { FailedAttempts: 0, LockedUntil: lockedUntil },
        });

        await writeAuditLog({
          userId: user.UserID,
          action: "account_locked",
          ipAddress: ip,
          details: { reason: `${MAX_FAILED_ATTEMPTS} failed login attempts` },
        });

        if (process.env.NODE_ENV === "production") {
          await resend.emails.send({
            from: "Smars <onboarding@resend.dev>",
            to: user.Email,
            subject: "Your SMARS account has been locked",
            html: `
              <div style="font-family: sans-serif; padding: 20px;">
                <h1>Account Locked</h1>
                <p>Hi ${user.FirstName},</p>
                <p>Your account has been temporarily locked after ${MAX_FAILED_ATTEMPTS} failed login attempts.</p>
                <p>You can try again in <strong>${LOCKOUT_MINUTES} minutes</strong>.</p>
                <p>If this wasn't you, please contact support immediately.</p>
              </div>
            `,
          });
        } else {
          console.log("--- DEVELOPMENT MODE: ACCOUNT LOCKED EMAIL ---");
          console.log(`Account locked for ${user.Email} until ${lockedUntil.toISOString()}`);
          console.log("----------------------------------------------");
        }

        return NextResponse.json(
          {
            error: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.`,
            lockedUntil: lockedUntil.toISOString(),
          },
          { status: 423 },
        );
      }

      await prisma.user.update({
        where: { UserID: user.UserID },
        data: { FailedAttempts: newFailedAttempts },
      });

      await writeAuditLog({
        userId: user.UserID,
        action: "login_failure",
        ipAddress: ip,
        details: { email, failedAttempts: newFailedAttempts },
      });

      const remaining = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      const body: { error: string; attemptsRemaining?: number } = {
        error: "Invalid credentials",
      };
      if (remaining <= 5) body.attemptsRemaining = remaining;

      return NextResponse.json(body, { status: 401 });
    }

    // 4. Successful auth — reset lockout counters
    await prisma.user.update({
      where: { UserID: user.UserID },
      data: { FailedAttempts: 0, LockedUntil: null },
    });

    // 5. If email is not verified, issue a partial JWT and send a fresh OTP
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

    // 6. Fully verified — issue a full session
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
