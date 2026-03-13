import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsPageContent from "@/components/settings/SettingsPageContent";
import PatientProfileCard from "@/components/settings/PatientProfileCard";
import DangerZone from "@/components/settings/DangerZone";
import PatientAllergyManager from "@/components/settings/PatientAllergyManager";
import PatientConditionManager from "@/components/settings/PatientConditionManager";

export default async function PatientSettingsPage() {
  const user = await getSession();
  if (!user || user.Role !== "patient") redirect("/login");

  const [profile, allergies, conditions, doctors] = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { UserID: user.UserID },
      include: { PrimaryCarePhysician: true },
    }),
    prisma.allergy.findMany({ where: { PatientID: user.UserID }, orderBy: { CreatedAt: "desc" } }),
    prisma.chronicCondition.findMany({ where: { PatientID: user.UserID }, orderBy: { CreatedAt: "desc" } }),
    prisma.user.findMany({
      where: { Role: "doctor" },
      select: { UserID: true, FirstName: true, LastName: true },
      orderBy: { LastName: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <SettingsPageContent />
      <PatientProfileCard initialProfile={profile} doctors={doctors} />
      <PatientAllergyManager initialAllergies={allergies} />
      <PatientConditionManager initialConditions={conditions} />
      <DangerZone />
    </div>
  );
}
