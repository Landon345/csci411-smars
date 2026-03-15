import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminUserManagement from "./AdminUserManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UsersIcon,
  CalendarDaysIcon,
  ServerIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Suspense } from "react";

export default async function AdminDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

  const [newRegistrations, monthlyAppointments, userDistribution, recentActivity] =
    await Promise.all([
      prisma.user.count({
        where: { CreatedAt: { gte: sevenDaysAgo } },
      }),
      prisma.appointment.count({
        where: { Date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.user.groupBy({
        by: ["Role"],
        _count: { UserID: true },
        orderBy: { _count: { UserID: "desc" } },
      }),
      prisma.auditLog.findMany({
        include: {
          User: { select: { Email: true } },
        },
        orderBy: { CreatedAt: "desc" },
        take: 5,
      }),
    ]);

  const roleLabels: Record<string, string> = {
    patient: "Patients",
    doctor: "Doctors",
    admin: "Admins",
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">
          Welcome back,{" "}
          <span className="text-muted-foreground">
            {user.FirstName} {user.LastName}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          You have successfully authenticated into your medical portal.
        </p>
      </header>

      <Card className="mb-6">
        <CardContent>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheckIcon className="h-4 w-4" />
            Your session is active and encrypted.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {/* New Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <UsersIcon className="h-4 w-4" />
              New Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{newRegistrations}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        {/* Monthly Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <CalendarDaysIcon className="h-4 w-4" />
              Monthly Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">{monthlyAppointments}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        {/* System Uptime */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <ServerIcon className="h-4 w-4" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">99.9%</p>
            <Badge className="mt-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Active
            </Badge>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <ChartBarIcon className="h-4 w-4" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="space-y-1">
                {userDistribution.map((row) => (
                  <li key={row.Role} className="flex items-center justify-between text-sm">
                    <Link
                      href={`/admin/dashboard?search=${row.Role}`}
                      className="text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {roleLabels[row.Role] ?? row.Role}
                    </Link>
                    <span className="font-medium">{row._count.UserID}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div className="py-10 text-center text-sm text-muted-foreground">Loading users…</div>}>
          <AdminUserManagement />
        </Suspense>
      </div>

      <Card className="mt-6">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
            <ClockIcon className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          {recentActivity.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-sm">
              No recent records to display.
            </p>
          ) : (
            <ul className="divide-y">
              {recentActivity.map((entry) => (
                <li key={entry.LogID} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                      {entry.Action.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {entry.User?.Email ?? "unknown"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.CreatedAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
