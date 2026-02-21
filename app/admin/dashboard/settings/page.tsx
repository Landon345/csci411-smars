import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import SettingsPageContent from "@/components/settings/SettingsPageContent";

export default async function AdminSettingsPage() {
  const user = await getSession();
  if (!user || user.Role !== "admin") redirect("/login");

  return <SettingsPageContent />;
}
