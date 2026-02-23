"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Patient {
  UserID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string | null;
  CreatedAt: string;
}

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/doctor/patients/list")
      .then((r) => r.json())
      .then((d) => setPatients(d.patients ?? []))
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo<ColumnDef<Patient, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.FirstName} ${row.LastName}`,
        meta: { label: "Name" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Name" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.FirstName} {row.original.LastName}
          </span>
        ),
      },
      {
        id: "email",
        accessorKey: "Email",
        meta: { label: "Email" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Email" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "phone",
        accessorKey: "Phone",
        meta: { label: "Phone" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Phone" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {(getValue() as string | null) || "—"}
          </span>
        ),
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.CreatedAt,
        sortingFn: "datetime",
        enableGlobalFilter: false,
        meta: { label: "Created" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Created" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.CreatedAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <>
        <header className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight">Patient List</h1>
          <p className="text-sm text-muted-foreground">View your patients.</p>
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
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </>
    );
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight">Patient List</h1>
        <p className="text-sm text-muted-foreground">View your patients.</p>
      </header>

      <DataTable
        data={patients}
        columns={columns}
        searchPlaceholder="Search patients..."
        onRowClick={(patient) =>
          router.push(`/doctor/dashboard/patients/${patient.UserID}`)
        }
      />
    </>
  );
}
