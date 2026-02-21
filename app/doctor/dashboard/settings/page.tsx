import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SettingsPageContent from "@/components/settings/SettingsPageContent";

export default async function DoctorSettingsPage() {
  const user = await getSession();
  if (!user || user.Role !== "doctor") redirect("/login");

  return <SettingsPageContent />;
}
