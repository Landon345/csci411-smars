import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function AdminPatientsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.Role !== "admin") redirect("/dashboard");

  const patients = await prisma.user.findMany({
    where: { Role: "patient" },
    select: {
      UserID: true,
      FirstName: true,
      LastName: true,
      Email: true,
      Phone: true,
      CreatedAt: true,
    },
    orderBy: { CreatedAt: "desc" },
  });

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Patient List</h1>
        <p className="text-sm text-zinc-500">
          View all registered patients.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-sm text-zinc-500"
                >
                  No patients found.
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr
                  key={patient.UserID}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                    {patient.FirstName} {patient.LastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {patient.Email}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {patient.Phone || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {patient.CreatedAt.toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
