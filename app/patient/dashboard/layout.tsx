import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";
import {
  HomeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  BeakerIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const patientNav = [
  { href: "/patient/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/patient/dashboard/appointments", label: "My Appointments", icon: CalendarDaysIcon },
  { href: "/patient/dashboard/records", label: "My Records", icon: DocumentTextIcon },
  { href: "/patient/dashboard/medications", label: "Medications", icon: BeakerIcon },
  { href: "/patient/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
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
