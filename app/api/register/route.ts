import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login } from "@/lib/auth";
import { encryptSSN } from "@/lib/crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { FirstName, LastName, Email, Password, Phone, SSN, Role } = body;

    // --- Input Validation ---
    const missing = ["FirstName", "LastName", "Email", "Password", "SSN"].filter(
      (f) => !body[f] || typeof body[f] !== "string" || !body[f].trim(),
    );
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 },
      );
    }

    if (!/.+@.+\..+/.test(Email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    if (Password.length < 8 || !/\d/.test(Password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters and contain at least one number" },
        { status: 400 },
      );
    }

    const ssnDigits = SSN.replace(/-/g, "");
    if (!/^\d{9}$/.test(ssnDigits)) {
      return NextResponse.json(
        { error: "SSN must be 9 digits (with or without dashes)" },
        { status: 400 },
      );
    }

    // Validate role — only patient or doctor allowed via registration
    const validRoles = ["patient", "doctor"] as const;
    const userRole = validRoles.includes(Role) ? Role : "patient";

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { Email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 409 },
      );
    }

    // 2. Generate 6-Digit Code & Expiration (15 minutes)
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verifyExpires = new Date(Date.now() + 15 * 60 * 1000);

    // 3. Hash Password & Encrypt SSN
    const hashedPassword = await bcrypt.hash(Password, 10);
    const encryptedSSN = encryptSSN(ssnDigits);

    // 4. Create User (Unverified)
    const newUser = await prisma.user.create({
      data: {
        FirstName,
        LastName,
        Email,
        Password: hashedPassword,
        Phone,
        SSN: encryptedSSN,
        Role: userRole,
        VerifyCode: verifyCode,
        VerifyExpires: verifyExpires,
        VerifyAttempts: 0,
        EmailVerified: null,
      },
    });

    // 5. Send Email via Resend (Production Only)
    if (process.env.NODE_ENV === "production") {
      await resend.emails.send({
        from: "Smars <onboarding@resend.dev>",
        to: Email,
        subject: "Verify your Smars Account",
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h1>Welcome, ${FirstName}!</h1>
            <p>Please use the code below to verify your account:</p>
            <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0;">
              ${verifyCode}
            </div>
            <p>This code will expire in 15 minutes.</p>
          </div>
        `,
      });
    } else {
      console.log("--- DEVELOPMENT MODE: EMAIL LOG ---");
      console.log(`Verification code for ${Email}: ${verifyCode}`);
      console.log("-----------------------------------");
    }

    // 6. Issue a partial session (emailVerified: false)
    // proxy.ts will redirect to /verify-email for any protected route access
    await login({
      UserID: newUser.UserID,
      Email: newUser.Email,
      FirstName: newUser.FirstName,
      LastName: newUser.LastName,
      Role: newUser.Role as "patient" | "doctor" | "admin",
      emailVerified: false,
    });

    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
