import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build the date range for "tomorrow" in UTC
  const now = new Date();
  const tomorrowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );
  const tomorrowEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 23, 59, 59),
  );

  const appointments = await prisma.appointment.findMany({
    where: {
      Date: { gte: tomorrowStart, lte: tomorrowEnd },
      Status: { in: ["pending", "scheduled"] },
      ReminderSent: false,
    },
    include: {
      Patient: { select: { FirstName: true, LastName: true, Email: true } },
      Doctor: { select: { FirstName: true, LastName: true } },
    },
  });

  if (appointments.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  for (const appt of appointments) {
    const appointmentDate = new Date(appt.Date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

    const startTime = new Date(appt.StartTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    const endTime = new Date(appt.EndTime).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });

    const emailHtml = buildReminderEmail({
      patientFirstName: appt.Patient.FirstName,
      doctorName: `Dr. ${appt.Doctor.FirstName} ${appt.Doctor.LastName}`,
      appointmentDate,
      startTime,
      endTime,
      place: appt.Place,
      reason: appt.Reason,
    });

    if (process.env.NODE_ENV === "production") {
      await resend.emails.send({
        from: "Smars <onboarding@resend.dev>",
        to: appt.Patient.Email,
        subject: `Appointment Reminder — Tomorrow at ${startTime}`,
        html: emailHtml,
      });
    } else {
      console.log("--- DEVELOPMENT MODE: APPOINTMENT REMINDER ---");
      console.log(`To: ${appt.Patient.Email}`);
      console.log(`Patient: ${appt.Patient.FirstName} ${appt.Patient.LastName}`);
      console.log(`Doctor: Dr. ${appt.Doctor.FirstName} ${appt.Doctor.LastName}`);
      console.log(`Date: ${appointmentDate} ${startTime} - ${endTime}`);
      console.log(`Place: ${appt.Place}`);
      console.log("----------------------------------------------");
    }

    await prisma.appointment.update({
      where: { AppointmentID: appt.AppointmentID },
      data: { ReminderSent: true },
    });

    sent++;
  }

  return NextResponse.json({ sent });
}

function buildReminderEmail({
  patientFirstName,
  doctorName,
  appointmentDate,
  startTime,
  endTime,
  place,
  reason,
}: {
  patientFirstName: string;
  doctorName: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  place: string;
  reason: string;
}) {
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #111;">
      <h2 style="margin-bottom: 4px;">Appointment Reminder</h2>
      <p style="color: #555; margin-top: 0;">Hi ${patientFirstName},</p>
      <p style="color: #555;">
        This is a reminder that you have an appointment scheduled for
        <strong>tomorrow</strong>.
      </p>

      <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #666; width: 100px;">Date</td>
            <td style="padding: 6px 0; font-weight: 600;">${appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Time</td>
            <td style="padding: 6px 0; font-weight: 600;">${startTime} – ${endTime}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Location</td>
            <td style="padding: 6px 0; font-weight: 600;">${place}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Reason</td>
            <td style="padding: 6px 0; font-weight: 600;">${reason}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666;">Doctor</td>
            <td style="padding: 6px 0; font-weight: 600;">${doctorName}</td>
          </tr>
        </table>
      </div>

      <p style="color: #555; font-size: 14px;">
        If you need to reschedule or have any questions, please contact your
        healthcare provider as soon as possible.
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 32px;">
        This is an automated reminder from S.M.A.R.S — Secure Medical Records.
      </p>
    </div>
  `;
}
