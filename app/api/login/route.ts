/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { login } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 1. Find user
    const user = await prisma.user.findUnique({
      where: { Email: email },
    });

    if (!user || !user.Password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // 3. Generate token & set cookie
    await login({
      UserID: user.UserID,
      Email: user.Email,
      FirstName: user.FirstName,
      LastName: user.LastName,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
