import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/auditLog";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.Role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  let email: string;
  try {
    const body = await request.json();
    email = body.email;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || typeof email !== "string" || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.inviteToken.create({
    data: {
      Email: email,
      Token: token,
      ExpiresAt: expiresAt,
      CreatedBy: user.UserID,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/register?invite=${token}`;

  if (process.env.NODE_ENV === "production") {
    await resend.emails.send({
      from: "Smars <onboarding@resend.dev>",
      to: email,
      subject: "You've been invited to join Smars as a Doctor",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1>Doctor Invitation</h1>
          <p>You have been invited to register as a doctor on S.M.A.R.S.</p>
          <p>Click the link below to complete your registration. This link expires in 48 hours.</p>
          <a href="${inviteUrl}" style="display:inline-block;margin:20px 0;padding:12px 24px;background:#18181b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600;">
            Accept Invitation
          </a>
          <p style="color:#71717a;font-size:12px;">If you did not expect this email, you can safely ignore it.</p>
        </div>
      `,
    });
  } else {
    console.log("--- DEVELOPMENT MODE: INVITE EMAIL LOG ---");
    console.log(`Invite URL for ${email}: ${inviteUrl}`);
    console.log("------------------------------------------");
  }

  writeAuditLog({
    userId: user.UserID,
    action: "invite_created",
    ipAddress: ip,
    details: { email },
  });

  return NextResponse.json({ inviteUrl }, { status: 201 });
}
