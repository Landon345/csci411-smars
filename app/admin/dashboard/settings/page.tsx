import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsPageContent from "@/components/settings/SettingsPageContent";
import PhoneNumberCard from "@/components/settings/PhoneNumberCard";
import DangerZone from "@/components/settings/DangerZone";

export default async function AdminSettingsPage() {
  const user = await getSession();
  if (!user || user.Role !== "admin") redirect("/login");

  const userData = await prisma.user.findUnique({
    where: { UserID: user.UserID },
    select: { FirstName: true, LastName: true, Phone: true },
  });

  return (
    <div className="space-y-8">
      <SettingsPageContent />
      <PhoneNumberCard
        initialFirstName={userData?.FirstName ?? user.FirstName}
        initialLastName={userData?.LastName ?? user.LastName}
        initialPhone={userData?.Phone ?? null}
      />
      <DangerZone />
    </div>
  );
}
