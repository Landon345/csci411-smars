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

    const body = await request.json();
    const { password } = body;

    // Validate input
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // 1. Find user to verify password
    const user = await prisma.user.findUnique({
      where: { UserID: session.UserID },
    });

    if (!user || !user.Password) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Check password — add a delay on failure to slow brute-force attempts
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    // 3. For doctors: block deregistration if they have records or prescriptions
    //    written for other patients. Deleting the account would orphan that data
    //    since DoctorID is a required FK on those tables.
    if (user.Role === "doctor") {
      const [orphanedRecords, orphanedPrescriptions] = await Promise.all([
        prisma.medicalRecord.count({
          where: { DoctorID: session.UserID, PatientID: { not: session.UserID } },
        }),
        prisma.prescription.count({
          where: { DoctorID: session.UserID, PatientID: { not: session.UserID } },
        }),
      ]);

      if (orphanedRecords > 0 || orphanedPrescriptions > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot deregister while you have active patient records or prescriptions. Please contact an administrator.",
          },
          { status: 400 },
        );
      }
    }

    // 4. Delete user data in FK-safe order.
    //    RecordDocument.UploadedBy and DoctorProfile/ProfilePhoto have required FKs
    //    with no cascade, so they must be removed before the User row can be deleted.
    await prisma.$transaction([
      prisma.recordDocument.deleteMany({
        where: { UploadedBy: session.UserID },
      }),
      prisma.prescription.deleteMany({
        where: { PatientID: session.UserID },
      }),
      prisma.medicalRecord.deleteMany({
        where: { PatientID: session.UserID },
      }),
      prisma.appointment.deleteMany({
        where: { OR: [{ DoctorID: session.UserID }, { PatientID: session.UserID }] },
      }),
      prisma.allergy.deleteMany({
        where: { PatientID: session.UserID },
      }),
      prisma.chronicCondition.deleteMany({
        where: { PatientID: session.UserID },
      }),
      prisma.doctorProfile.deleteMany({
        where: { UserID: session.UserID },
      }),
      prisma.patientProfile.deleteMany({
        where: { UserID: session.UserID },
      }),
      prisma.profilePhoto.deleteMany({
        where: { UserID: session.UserID },
      }),
      prisma.user.delete({ where: { UserID: session.UserID } }),
    ]);

    // 5. Clear auth cookie
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
