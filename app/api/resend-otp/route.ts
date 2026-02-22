import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Rate limit: 3 resend requests per IP per 10 minutes
  if (!rateLimit(ip, "resend-otp", 3, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many resend requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await decrypt(token);
    if (!session?.user?.Email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { Email: session.user.Email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.EmailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 },
      );
    }

    // Generate a new OTP and reset attempt counter
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
        subject: "Your new Smars verification code",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h1>New verification code</h1>
            <p>Use the code below to verify your account:</p>
            <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0;">
              ${verifyCode}
            </div>
            <p>This code will expire in 15 minutes.</p>
          </div>
        `,
      });
    } else {
      console.log("--- DEVELOPMENT MODE: EMAIL LOG ---");
      console.log(`New verification code for ${user.Email}: ${verifyCode}`);
      console.log("-----------------------------------");
    }

    return NextResponse.json(
      { message: "Verification code sent" },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to resend verification code" },
      { status: 500 },
    );
  }
}
