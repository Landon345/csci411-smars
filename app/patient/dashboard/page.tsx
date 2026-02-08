import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function PatientDashboard() {
  const user = await getSession();
  if (!user) redirect("/login");

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

      <div className="grid grid-cols-3 gap-6">
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
