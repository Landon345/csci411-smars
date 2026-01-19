import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { decrypt } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Dashboard() {
  // 1. Get the session cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  // 2. Validate and Decrypt
  if (!token) redirect("/login");

  const session = await decrypt(token);
  if (!session || !session.user) redirect("/login");

  // Access user data from the session payload
  const { FirstName, LastName } = session.user;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6">
        <div className="mb-10 flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-black font-bold italic">
            S
          </div>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            S.M.A.R.S
          </span>
        </div>

        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50"
          >
            Overview
          </Link>
          <Link
            href="/dashboard/records"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Medical Records
          </Link>
          <Link
            href="/dashboard/settings"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            Settings
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            {/* PERSONALIZED WELCOME MESSAGE */}
            <h1 className="text-2xl font-medium tracking-tight">
              Welcome back,{" "}
              <span className="text-zinc-500">
                {FirstName} {LastName}
              </span>
            </h1>
            <p className="text-sm text-zinc-500">
              You have successfully authenticated into your medical portal.
            </p>
          </div>
          <div className="flex gap-3">
            <LogoutButton />
            <button className="h-9 px-4 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black text-sm font-medium">
              New Record
            </button>
          </div>
        </header>

        {/* Stats Grid and Tables follow... */}
        <div className="p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <p className="text-sm text-zinc-500">
            Your session is active and encrypted.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          {[
            { label: "Heart Rate", value: "72 bpm", status: "Normal" },
            { label: "Blood Pressure", value: "120/80", status: "Optimal" },
            { label: "Sleep Quality", value: "8h 12m", status: "Good" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-medium text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </p>
              <span className="mt-2 inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {stat.status}
              </span>
            </div>
          ))}
        </div>

        {/* Placeholder Table */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium">Recent Activity</h3>
          </div>
          <div className="p-8 text-center text-zinc-500 text-sm">
            No recent records to display.
          </div>
        </div>
      </main>
    </div>
  );
}
