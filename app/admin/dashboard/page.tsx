import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AdminUserManagement from "./AdminUserManagement";

export default async function AdminDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

  const totalUsers = await prisma.user.count();
  const patientCount = await prisma.user.count({ where: { Role: "patient" } });

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">
          Welcome back,{" "}
          <span className="text-zinc-500">
            {user.FirstName} {user.LastName}
          </span>
        </h1>
        <p className="text-sm text-zinc-500">
          You have successfully authenticated into your medical portal.
        </p>
      </header>

      <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mb-6">
        <p className="text-sm text-zinc-500">
          Your session is active and encrypted.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
            Total Users
          </p>
          <p className="text-2xl font-medium text-zinc-900 dark:text-zinc-50">
            {totalUsers}
          </p>
        </div>
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
            Total Patients
          </p>
          <p className="text-2xl font-medium text-zinc-900 dark:text-zinc-50">
            {patientCount}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AdminUserManagement />
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium">Recent Activity</h3>
        </div>
        <div className="p-8 text-center text-zinc-500 text-sm">
          No recent records to display.
        </div>
      </div>
    </>
  );
}
