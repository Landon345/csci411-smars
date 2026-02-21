import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SettingsPageContent from "@/components/settings/SettingsPageContent";

export default async function PatientSettingsPage() {
  const user = await getSession();
  if (!user || user.Role !== "patient") redirect("/login");

  return <SettingsPageContent user={user} />;
}
