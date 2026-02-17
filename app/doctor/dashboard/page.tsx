import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default async function DoctorDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

  const patientCount = await prisma.user.count({
    where: {
      Role: "patient",
      OR: [
        { PatientAppointments: { some: { DoctorID: user.UserID } } },
        { PatientRecords: { some: { DoctorID: user.UserID } } },
      ],
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingCount = await prisma.appointment.count({
    where: {
      DoctorID: user.UserID,
      Status: "scheduled",
      Date: { gte: today },
    },
  });

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

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <UserGroupIcon className="h-4 w-4" />
              Your Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{patientCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <CalendarDaysIcon className="h-4 w-4" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{upcomingCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
            <ClockIcon className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No recent records to display.
        </CardContent>
      </Card>
    </>
  );
}
