"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/lib/avatarColor";
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

const SETTINGS_PATH: Record<string, string> = {
  patient: "/patient/dashboard/settings",
  doctor: "/doctor/dashboard/settings",
  admin: "/admin/dashboard/settings",
};

const roleTextColors: Record<string, string> = {
  patient: "text-blue-600 dark:text-blue-400",
  doctor: "text-green-600 dark:text-green-400",
  admin: "text-purple-600 dark:text-purple-400",
};

interface DashboardShellProps {
  user: { UserID: string; FirstName: string; LastName: string; Role: string };
  children: React.ReactNode;
}

export default function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const navLinks = NAV_LINKS[user.Role] ?? [];
  const settingsPath = SETTINGS_PATH[user.Role] ?? "/dashboard";
  const avatarStyle = getAvatarColor(user.UserID);
  const initials = getInitials(user.FirstName, user.LastName);

  useEffect(() => {
    fetch("/api/user/profile-photo")
      .then((r) => r.json())
      .then(({ viewUrl }) => setPhotoUrl(viewUrl ?? null))
      .catch(() => {});
  }, []);

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
                  <Image src="/logo.svg" alt="S.M.A.R.S" width={48} height={32} className="shrink-0" />
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

          <SidebarMenu>
            {/* User avatar — avatar visible in icon mode, name+role hidden */}
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip={`${user.FirstName} ${user.LastName}`}
              >
                <Link href={settingsPath}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                      src={photoUrl ?? undefined}
                      alt={`${user.FirstName} ${user.LastName}`}
                    />
                    <AvatarFallback style={avatarStyle} className="text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                    <span className="truncate font-medium">
                      {user.FirstName} {user.LastName}
                    </span>
                    <span className={`truncate text-xs capitalize ${roleTextColors[user.Role] ?? "text-muted-foreground"}`}>
                      {user.Role}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Logout */}
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
        <main className="flex-1 p-4 sm:p-10">{children}</main>
      </SidebarInset>
    </SidebarProvider>
    </>
  );
}
