import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";

const patientNav = [
  { href: "/patient/dashboard", label: "Overview" },
  { href: "/patient/dashboard/records", label: "My Records" },
  { href: "/patient/dashboard/settings", label: "Settings" },
];

export default async function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.Role !== "patient") redirect("/dashboard");

  return (
    <DashboardShell user={user} navLinks={patientNav}>
      {children}
    </DashboardShell>
  );
}
