import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheckIcon,
  ClockIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  severe: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function formatBloodType(bt: string | null | undefined): string {
  if (!bt) return "Unknown";
  return bt.replace("_positive", "+").replace("_negative", "-");
}

export default async function PatientDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(startOfToday);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [profile, allergies, conditions, activeMeds, upcomingAppointments, recordCount, lastVisit] =
    await Promise.all([
      prisma.patientProfile.findUnique({
        where: { UserID: user.UserID },
        include: { PrimaryCarePhysician: { select: { FirstName: true, LastName: true } } },
      }),
      prisma.allergy.findMany({
        where: { PatientID: user.UserID },
        orderBy: { CreatedAt: "desc" },
      }),
      prisma.chronicCondition.findMany({
        where: { PatientID: user.UserID },
        orderBy: { CreatedAt: "desc" },
      }),
      prisma.prescription.findMany({
        where: { PatientID: user.UserID, Status: "active" },
        orderBy: { StartDate: "desc" },
      }),
      prisma.appointment.findMany({
        where: {
          PatientID: user.UserID,
          Date: { gte: startOfToday, lte: thirtyDaysFromNow },
          Status: { notIn: ["canceled", "no_show"] },
        },
        orderBy: { Date: "asc" },
      }),
      prisma.medicalRecord.count({
        where: { PatientID: user.UserID },
      }),
      prisma.appointment.findFirst({
        where: { PatientID: user.UserID, Status: "completed" },
        orderBy: { Date: "desc" },
        select: { Date: true },
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

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <Link href="/patient/dashboard/appointments?search=scheduled" className="group">
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <CalendarDaysIcon className="h-4 w-4" />
                Upcoming (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">None scheduled.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {upcomingAppointments.map((appt) => (
                    <Badge key={appt.AppointmentID} variant="secondary" className="text-xs">
                      {new Date(appt.Date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/dashboard/records" className="group">
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <ClipboardDocumentListIcon className="h-4 w-4" />
                Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">{recordCount}</p>
              {recordCount === 0 && (
                <p className="text-xs text-muted-foreground mt-1">No records yet.</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/dashboard/medications?search=active" className="group">
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <BeakerIcon className="h-4 w-4" />
                Active Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">{activeMeds.length}</p>
              {activeMeds.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">None active.</p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/patient/dashboard/appointments?search=completed" className="group">
          <Card className="h-full transition-colors group-hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <ClockIcon className="h-4 w-4" />
                Last Visit
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lastVisit ? (
                <p className="text-lg font-medium">
                  {new Date(lastVisit.Date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No visits yet.</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Medical Identity Row */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Blood Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.BloodType ? (
              <p className="text-2xl font-medium">{formatBloodType(profile.BloodType)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not on file.{" "}
                <Link href="/patient/dashboard/settings" className="underline underline-offset-4">
                  Add in Settings
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Primary Care Physician
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.PrimaryCarePhysician ? (
              <p className="text-lg font-medium">
                Dr. {profile.PrimaryCarePhysician.FirstName} {profile.PrimaryCarePhysician.LastName}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                None on file.{" "}
                <Link href="/patient/dashboard/settings" className="underline underline-offset-4">
                  Add in Settings
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Insurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.InsuranceProvider ? (
              <>
                <p className="text-lg font-medium">{profile.InsuranceProvider}</p>
                {profile.InsurancePolicyNumber && (
                  <p className="text-sm text-muted-foreground">
                    Policy: {profile.InsurancePolicyNumber}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                None on file.{" "}
                <Link href="/patient/dashboard/settings" className="underline underline-offset-4">
                  Add in Settings
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Allergies & Medications Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-medium">Allergies</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {allergies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                None on file.{" "}
                <Link href="/patient/dashboard/settings" className="underline underline-offset-4">
                  Add in Settings
                </Link>
              </p>
            ) : (
              <ul className="space-y-2">
                {allergies.map((a) => (
                  <li key={a.AllergyID} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{a.Name}</p>
                      {a.Reaction && (
                        <p className="text-xs text-muted-foreground">{a.Reaction}</p>
                      )}
                    </div>
                    <Badge className={severityColors[a.Severity]}>{a.Severity}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-medium">Current Medications</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {activeMeds.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active medications.</p>
            ) : (
              <ul className="space-y-2">
                {activeMeds.map((rx) => (
                  <li key={rx.PrescriptionID} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{rx.Medication}</p>
                      <p className="text-xs text-muted-foreground">
                        {rx.Dosage} · {rx.Frequency}
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conditions & Emergency Contact Row */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-medium">Chronic Conditions</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {conditions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                None on file.{" "}
                <Link href="/patient/dashboard/settings" className="underline underline-offset-4">
                  Add in Settings
                </Link>
              </p>
            ) : (
              <ul className="space-y-1">
                {conditions.map((c) => (
                  <li key={c.ConditionID} className="text-sm">
                    {c.Name}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              <ClockIcon className="h-4 w-4" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {profile?.EmergencyContactName ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">{profile.EmergencyContactName}</p>
                {profile.EmergencyContactRelationship && (
                  <p className="text-xs text-muted-foreground">
                    {profile.EmergencyContactRelationship}
                  </p>
                )}
                {profile.EmergencyContactPhone && (
                  <p className="text-xs text-muted-foreground">{profile.EmergencyContactPhone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                None on file.{" "}
                <Link href="/patient/dashboard/settings" className="underline underline-offset-4">
                  Add in Settings
                </Link>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
