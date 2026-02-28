"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  ArrowLeftStartOnRectangleIcon,
  HomeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  BeakerIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { type ComponentType } from "react";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";

interface NavLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_LINKS: Record<string, NavLink[]> = {
  doctor: [
    { href: "/doctor/dashboard", label: "Overview", icon: HomeIcon },
    { href: "/doctor/dashboard/appointments", label: "Appointments", icon: CalendarDaysIcon },
    { href: "/doctor/dashboard/records", label: "Medical Records", icon: ClipboardDocumentListIcon },
    { href: "/doctor/dashboard/prescriptions", label: "Prescriptions", icon: BeakerIcon },
    { href: "/doctor/dashboard/patients", label: "Patient List", icon: UserGroupIcon },
    { href: "/doctor/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
  ],
  patient: [
    { href: "/patient/dashboard", label: "Overview", icon: HomeIcon },
    { href: "/patient/dashboard/appointments", label: "My Appointments", icon: CalendarDaysIcon },
    { href: "/patient/dashboard/doctors", label: "Find a Doctor", icon: MagnifyingGlassIcon },
    { href: "/patient/dashboard/records", label: "My Records", icon: DocumentTextIcon },
    { href: "/patient/dashboard/medications", label: "Medications", icon: BeakerIcon },
    { href: "/patient/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
  ],
  admin: [
    { href: "/admin/dashboard", label: "Overview", icon: HomeIcon },
    { href: "/admin/dashboard/patients", label: "Patient List", icon: UserGroupIcon },
    { href: "/admin/dashboard/audit-log", label: "Audit Log", icon: ClipboardDocumentCheckIcon },
    { href: "/admin/dashboard/invite", label: "Invite Doctor", icon: EnvelopeIcon },
    { href: "/admin/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
  ],
};

const roleBadgeColors: Record<string, string> = {
  patient: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  doctor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

interface DashboardShellProps {
  user: { FirstName: string; LastName: string; Role: string };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const navLinks = NAV_LINKS[user.Role] ?? [];

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
    <SessionExpiryWarning />
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {/* Logo */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="S.M.A.R.S">
                <Link href="/">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
                    <span className="font-bold italic text-white dark:text-black">S</span>
                  </div>
                  <span className="font-medium">S.M.A.R.S</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Nav links */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navLinks.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === link.href}
                      tooltip={link.label}
                    >
                      <Link href={link.href}>
                        <link.icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* User info + actions */}
        <SidebarFooter>
          <SidebarSeparator />

          {/* Name + role badge — hidden in icon mode */}
          <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between gap-2 px-2 py-1">
            <span className="text-sm font-medium truncate">
              {user.FirstName} {user.LastName}
            </span>
            <Badge
              variant="secondary"
              className={`shrink-0 capitalize ${roleBadgeColors[user.Role] ?? ""}`}
            >
              {user.Role}
            </Badge>
          </div>

          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                disabled={loggingOut}
                tooltip="Log out"
              >
                <ArrowLeftStartOnRectangleIcon className="h-4 w-4" />
                <span>{loggingOut ? "Logging out…" : "Log out"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Theme toggle — hidden in icon mode */}
          <div className="group-data-[collapsible=icon]:hidden px-2 pb-1">
            <ThemeToggle />
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}
