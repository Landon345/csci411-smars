"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";

interface Patient {
  UserID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string | null;
  CreatedAt: string;
}

export function PatientsTable({ patients }: { patients: Patient[] }) {
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

  return (
    <DataTable
      data={patients}
      columns={columns}
      searchPlaceholder="Search patients..."
    />
  );
}
