import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";
import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const adminNav = [
  { href: "/admin/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/admin/dashboard/patients", label: "Patient List", icon: UserGroupIcon },
  { href: "/admin/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.Role !== "admin") redirect("/dashboard");

  return (
    <DashboardShell user={user} navLinks={adminNav}>
      {children}
    </DashboardShell>
  );
}
