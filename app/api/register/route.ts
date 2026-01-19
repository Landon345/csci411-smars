import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust path to your prisma client
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth"; // Your JWT helper
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { FirstName, LastName, Email, Password, Phone, SSN } = body;

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
    const verifyExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // 4. Create User (Unverified)
    const newUser = await prisma.user.create({
      data: {
        FirstName,
        LastName,
        Email,
        Password: hashedPassword,
        Phone,
        SSN,
        VerifyCode: verifyCode,
        VerifyExpires: verifyExpires,
        EmailVerified: null,
      },
    });

    // 5. Send Email via Resend
    await resend.emails.send({
      from: "StrideSync <onboarding@resend.dev>", // Use your verified domain in prod
      to: Email,
      subject: "Verify your StrideSync Account",
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

    // 6. Create Session (So they are "logged in" to access the Verify page)
    // We add 'Verified: false' to the session payload if you want to restrict other pages
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sessionToken = await encrypt({
      user: {
        UserID: newUser.UserID,
        Email: newUser.Email,
        FirstName: newUser.FirstName,
        LastName: newUser.LastName,
      },
      expires,
    });

    const response = NextResponse.json(
      { message: "Registration successful" },
      { status: 201 },
    );

    response.cookies.set("auth_token", sessionToken, {
      expires,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
