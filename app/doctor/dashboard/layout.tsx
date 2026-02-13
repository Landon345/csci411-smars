import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardShell from "@/components/DashboardShell";
import {
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const doctorNav = [
  { href: "/doctor/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/doctor/dashboard/appointments", label: "Appointments", icon: CalendarDaysIcon },
  { href: "/doctor/dashboard/patients", label: "Patient List", icon: UserGroupIcon },
  { href: "/doctor/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
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
