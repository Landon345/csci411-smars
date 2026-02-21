import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/session";
import { logout } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password } = await request.json();

    // 1. Find user to verify password
    const user = await prisma.user.findUnique({
      where: { UserID: session.UserID },
    });

    if (!user || !user.Password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    // 3. Delete user related records and user in correct order to respect foreign keys
    await prisma.$transaction([
      prisma.prescription.deleteMany({
        where: { OR: [{ DoctorID: session.UserID }, { PatientID: session.UserID }] },
      }),
      prisma.medicalRecord.deleteMany({
        where: { OR: [{ DoctorID: session.UserID }, { PatientID: session.UserID }] },
      }),
      prisma.appointment.deleteMany({
        where: { OR: [{ DoctorID: session.UserID }, { PatientID: session.UserID }] },
      }),
      prisma.session.deleteMany({ where: { UserID: session.UserID } }),
      prisma.user.delete({ where: { UserID: session.UserID } }),
    ]);

    // 4. Logout (clear cookie)
    await logout();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deregistration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
