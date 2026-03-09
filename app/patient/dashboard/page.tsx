import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheckIcon,
  ClockIcon,
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

  const [profile, allergies, conditions, activeMeds] = await Promise.all([
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
