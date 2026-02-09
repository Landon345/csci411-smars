import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export default async function DoctorPatientsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.Role !== "doctor") redirect("/dashboard");

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
        <p className="text-sm text-muted-foreground">
          View all registered patients.
        </p>
      </header>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient) => (
                <TableRow key={patient.UserID}>
                  <TableCell className="font-medium">
                    {patient.FirstName} {patient.LastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.Email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.Phone || "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {patient.CreatedAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
