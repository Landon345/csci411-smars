import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SettingsPageContent from "@/components/settings/SettingsPageContent";
import DangerZone from "@/components/settings/DangerZone";

export default async function AdminSettingsPage() {
  const user = await getSession();
  if (!user || user.Role !== "admin") redirect("/login");

  return (
    <div className="space-y-8">
      <SettingsPageContent />
      <DangerZone />
    </div>
  );
}
