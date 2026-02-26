import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user || user.Role !== "doctor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { AppointmentID: id },
    include: {
      Patient: { select: { FirstName: true, LastName: true, Email: true } },
      Doctor: { select: { FirstName: true, LastName: true } },
    },
  });

  if (!appointment || appointment.DoctorID !== user.UserID) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!["pending", "scheduled"].includes(appointment.Status)) {
    return NextResponse.json(
      { error: "Reminders can only be sent for pending or scheduled appointments" },
      { status: 400 },
    );
  }

  const appointmentDate = new Date(appointment.Date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const startTime = new Date(appointment.StartTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
  const endTime = new Date(appointment.EndTime).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const emailHtml = buildReminderEmail({
    patientFirstName: appointment.Patient.FirstName,
    doctorName: `Dr. ${appointment.Doctor.FirstName} ${appointment.Doctor.LastName}`,
    appointmentDate,
    startTime,
    endTime,
    place: appointment.Place,
    reason: appointment.Reason,
  });

  if (process.env.NODE_ENV === "production") {
    await resend.emails.send({
      from: "Smars <onboarding@resend.dev>",
      to: appointment.Patient.Email,
      subject: `Appointment Reminder — ${appointmentDate} at ${startTime}`,
      html: emailHtml,
    });
  } else {
    console.log("--- DEVELOPMENT MODE: MANUAL APPOINTMENT REMINDER ---");
    console.log(`To: ${appointment.Patient.Email}`);
    console.log(`Patient: ${appointment.Patient.FirstName} ${appointment.Patient.LastName}`);
    console.log(`Doctor: Dr. ${appointment.Doctor.FirstName} ${appointment.Doctor.LastName}`);
    console.log(`Date: ${appointmentDate} ${startTime} - ${endTime}`);
    console.log(`Place: ${appointment.Place}`);
    console.log("-----------------------------------------------------");
  }

  await prisma.appointment.update({
    where: { AppointmentID: id },
    data: { ReminderSent: true },
  });

  return NextResponse.json({ success: true });
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
        Your doctor has sent you a reminder about your upcoming appointment.
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
        This reminder was sent manually by your doctor via S.M.A.R.S — Secure Medical Records.
      </p>
    </div>
  `;
}
