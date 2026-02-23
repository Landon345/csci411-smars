import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PatientsTable } from "./PatientsTable";

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

  const serialized = patients.map((p) => ({
    ...p,
    CreatedAt: p.CreatedAt.toISOString(),
  }));

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Patient List</h1>
        <p className="text-sm text-muted-foreground">
          View all registered patients.
        </p>
      </header>

      <PatientsTable patients={serialized} />
    </>
  );
}
