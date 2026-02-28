import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SettingsPageContent from "@/components/settings/SettingsPageContent";
import DoctorProfileCard from "@/components/settings/DoctorProfileCard";

export default async function DoctorSettingsPage() {
  const user = await getSession();
  if (!user || user.Role !== "doctor") redirect("/login");

  return (
    <div className="space-y-8">
      <SettingsPageContent />
      <DoctorProfileCard />
    </div>
  );
}
