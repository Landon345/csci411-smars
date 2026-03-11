import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default async function DoctorDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const threeDaysAgo = new Date(todayStart);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const [todaysAppointments, recentlySeenPatients, pendingCount] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        DoctorID: user.UserID,
        Date: { gte: todayStart, lt: tomorrow },
        Status: { notIn: ["canceled", "no_show"] },
      },
      include: { Patient: { select: { FirstName: true, LastName: true } } },
      orderBy: { StartTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        DoctorID: user.UserID,
        Status: "completed",
        Date: { gte: threeDaysAgo, lt: tomorrow },
      },
      select: {
        PatientID: true,
        Patient: { select: { FirstName: true, LastName: true } },
      },
      distinct: ["PatientID"],
    }),
    prisma.appointment.count({
      where: {
        DoctorID: user.UserID,
        Status: "pending",
      },
    }),
  ]);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">
          Welcome back,{" "}
          <span className="text-muted-foreground">
            {user.FirstName} {user.LastName}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          You have successfully authenticated into your medical portal.
        </p>
      </header>

      <Card className="mb-6">
        <CardContent>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheckIcon className="h-4 w-4" />
            Your session is active and encrypted.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Link href="/doctor/dashboard/appointments?filter=today" className="group">
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <CalendarDaysIcon className="h-4 w-4" />
                Today&apos;s Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments today.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {todaysAppointments.map((appt) => (
                    <Badge key={appt.AppointmentID} variant="secondary" className="text-xs">
                      {appt.Patient.FirstName} {appt.Patient.LastName}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Patients Seen Recently */}
        <Link href="/doctor/dashboard/appointments?filter=recent" className="group">
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <UserGroupIcon className="h-4 w-4" />
                Patients Seen (3 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentlySeenPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed visits recently.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {recentlySeenPatients.map((appt) => (
                    <Badge key={appt.PatientID} variant="secondary" className="text-xs">
                      {appt.Patient.FirstName} {appt.Patient.LastName}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Pending Requests */}
        <Link href="/doctor/dashboard/appointments?search=pending" className="group">
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <ExclamationCircleIcon className="h-4 w-4" />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">{pendingCount}</p>
              {pendingCount === 0 ? (
                <p className="text-xs text-muted-foreground mt-1">No pending requests.</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  View in appointments
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  );
}
