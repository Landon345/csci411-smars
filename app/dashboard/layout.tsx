import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login");

  const role = user.Role;

  const roleBadgeColors: Record<string, string> = {
    patient:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    doctor:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    admin:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 flex flex-col">
        <div className="mb-10 flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-black font-bold italic">
            S
          </div>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            S.M.A.R.S
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Overview
          </Link>

          {/* Patient-only */}
          {role === "patient" && (
            <Link
              href="/dashboard/records"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              My Records
            </Link>
          )}

          {/* Doctor-only */}
          {(role === "doctor" || role === "admin") && (
            <Link
              href="/dashboard/patients"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Patient List
            </Link>
          )}

          {/* Admin-only */}
          {role === "admin" && (
            <Link
              href="/dashboard/admin"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              User Management
            </Link>
          )}

          <Link
            href="/dashboard/settings"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Settings
          </Link>
        </nav>

        {/* User info at bottom */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {user.FirstName} {user.LastName}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${roleBadgeColors[role] || ""}`}
            >
              {role}
            </span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
