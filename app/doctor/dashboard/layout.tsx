import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";

const doctorNav = [
  { href: "/doctor/dashboard", label: "Overview" },
  { href: "/doctor/dashboard/appointments", label: "Appointments" },
  { href: "/doctor/dashboard/patients", label: "Patient List" },
  { href: "/doctor/dashboard/settings", label: "Settings" },
];

export default async function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.Role !== "doctor") redirect("/dashboard");

  return (
    <DashboardShell user={user} navLinks={doctorNav}>
      {children}
    </DashboardShell>
  );
}
