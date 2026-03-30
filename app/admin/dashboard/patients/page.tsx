import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PatientsTable } from "./PatientsTable";

export default async function AdminPatientsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.Role !== "admin") redirect("/dashboard");

  const [patients, doctors] = await Promise.all([
    prisma.user.findMany({
      where: { Role: "patient" },
      select: {
        UserID: true,
        FirstName: true,
        LastName: true,
        Email: true,
        Phone: true,
        CreatedAt: true,
        PatientProfile: {
          select: {
            PrimaryCarePhysicianID: true,
            PrimaryCarePhysician: {
              select: { FirstName: true, LastName: true },
            },
          },
        },
      },
      orderBy: { CreatedAt: "desc" },
    }),
    prisma.user.findMany({
      where: { Role: "doctor" },
      select: { UserID: true, FirstName: true, LastName: true },
      orderBy: { LastName: "asc" },
    }),
  ]);

  const serializedPatients = patients.map((p) => ({
    ...p,
    CreatedAt: p.CreatedAt.toISOString(),
  }));

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Patient List</h1>
        <p className="text-sm text-muted-foreground">
          View all registered patients and manage primary care assignments.
        </p>
      </header>

      <PatientsTable patients={serializedPatients} doctors={doctors} />
    </>
  );
}
