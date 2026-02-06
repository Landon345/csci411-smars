import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function RecordsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.Role !== "patient") redirect("/dashboard");

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">
          My Medical Records
        </h1>
        <p className="text-sm text-zinc-500">
          View and manage your medical history.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={4}
                className="px-6 py-8 text-center text-sm text-zinc-500"
              >
                No records found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
