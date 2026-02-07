import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";

const adminNav = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/dashboard/patients", label: "Patient List" },
  { href: "/admin/dashboard/settings", label: "Settings" },
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
