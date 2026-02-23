"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { PrescriptionDetail } from "@/components/details/PrescriptionDetail";
import { formatDate } from "@/lib/format";

interface Prescription {
  PrescriptionID: string;
  Doctor: { FirstName: string; LastName: string };
  Medication: string;
  Dosage: string;
  Frequency: string;
  Duration: string;
  Refills: number;
  StartDate: string;
  EndDate: string | null;
  Status: string;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "discontinued", label: "Discontinued" },
];

const statusVariant: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  discontinued:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};


export default function PatientMedicationsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchMedications();
  }, []);

  async function fetchMedications() {
    try {
      const res = await fetch("/api/patient/medications");
      if (!res.ok) return;
      const data = await res.json();
      setPrescriptions(data.prescriptions);
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo<ColumnDef<Prescription, unknown>[]>(
    () => [
      {
        id: "medication",
        accessorKey: "Medication",
        meta: { label: "Medication" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Medication" />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        id: "dosage",
        accessorKey: "Dosage",
        meta: { label: "Dosage" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Dosage" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "frequency",
        accessorKey: "Frequency",
        meta: { label: "Frequency" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Frequency" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "duration",
        accessorKey: "Duration",
        meta: { label: "Duration" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Duration" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "refills",
        accessorKey: "Refills",
        meta: { label: "Refills" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Refills" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as number}</span>
        ),
      },
      {
        id: "startDate",
        accessorFn: (row) => row.StartDate,
        sortingFn: "datetime",
        enableGlobalFilter: false,
        meta: { label: "Start" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Start" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.StartDate)}
          </span>
        ),
      },
      {
        id: "endDate",
        accessorFn: (row) => row.EndDate ?? "",
        sortingFn: "datetime",
        enableGlobalFilter: false,
        meta: { label: "End" },
        header: ({ column }) => (
          <SortableHeader column={column} label="End" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.EndDate ? formatDate(row.original.EndDate) : "-"}
          </span>
        ),
      },
      {
        id: "doctor",
        accessorFn: (row) =>
          `Dr. ${row.Doctor.FirstName} ${row.Doctor.LastName}`,
        meta: { label: "Doctor" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Doctor" />
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue() as string}</span>
        ),
      },
      {
        id: "status",
        accessorKey: "Status",
        meta: { label: "Status" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Status" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={statusVariant[row.original.Status] || ""}
          >
            {STATUS_OPTIONS.find((s) => s.value === row.original.Status)
              ?.label ?? row.original.Status}
          </Badge>
        ),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <>
        <header className="mb-4">
          <h2 className="text-xl font-medium tracking-tight">My Medications</h2>
          <p className="text-sm text-muted-foreground">View your prescriptions and medications.</p>
        </header>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Refills</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
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
      <header className="mb-4">
        <h2 className="text-xl font-medium tracking-tight">My Medications</h2>
        <p className="text-sm text-muted-foreground">
          View your prescriptions and medications.
        </p>
      </header>

      <DataTable
        data={prescriptions}
        columns={columns}
        searchPlaceholder="Search medications..."
        onRowClick={(rx) => setSelected(rx)}
      />

      <PrescriptionDetail prescription={selected} onClose={() => setSelected(null)} />
    </>
  );
}
