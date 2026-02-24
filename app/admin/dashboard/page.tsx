import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminUserManagement from "./AdminUserManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UsersIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default async function AdminDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

  const [totalUsers, patientCount, recentActivity] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { Role: "patient" } }),
    prisma.auditLog.findMany({
      include: {
        User: { select: { Email: true } },
      },
      orderBy: { CreatedAt: "desc" },
      take: 5,
    }),
  ]);

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

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <UsersIcon className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">
              {totalUsers}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <UserGroupIcon className="h-4 w-4" />
              Total Patients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium">
              {patientCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <AdminUserManagement />
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
