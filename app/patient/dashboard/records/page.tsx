import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export default async function PatientRecordsPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.Role !== "patient") redirect("/dashboard");

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">
          My Medical Records
        </h1>
        <p className="text-sm text-muted-foreground">
          View and manage your medical history.
        </p>
      </header>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-8"
              >
                No records found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
