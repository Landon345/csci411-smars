"use client";

import { useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
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
import { RecordDetail } from "@/components/details/RecordDetail";
import { formatDate } from "@/lib/format";

interface MedicalRecord {
  RecordID: string;
  Doctor: { FirstName: string; LastName: string };
  Appointment: { Date: string; Type: string; Reason: string } | null;
  VisitDate: string;
  ChiefComplaint: string;
  DiagnosisCode: string;
  DiagnosisDesc: string;
  TreatmentPlan: string;
  Type: string;
}

const TYPE_OPTIONS = [
  { value: "office_visit", label: "Office Visit" },
  { value: "lab_result", label: "Lab Result" },
  { value: "imaging", label: "Imaging" },
  { value: "referral", label: "Referral" },
  { value: "procedure_note", label: "Procedure Note" },
];


function typeLabel(type: string) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch("/api/patient/records");
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records);
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo<ColumnDef<MedicalRecord, unknown>[]>(
    () => [
      {
        id: "visitDate",
        accessorFn: (row) => row.VisitDate,
        sortingFn: "datetime",
        enableGlobalFilter: false,
        meta: { label: "Date" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Date" />
        ),
        cell: ({ row }) => formatDate(row.original.VisitDate),
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
        id: "appointment",
        accessorFn: (row) =>
          row.Appointment ? formatDate(row.Appointment.Date) : "",
        enableGlobalFilter: false,
        meta: { label: "Appointment" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Appointment" />
        ),
        cell: ({ row }) =>
          row.original.Appointment ? (
            <span className="text-muted-foreground">
              {formatDate(row.original.Appointment.Date)}
              <span className="block text-xs capitalize">
                {row.original.Appointment.Type.replace("_", " ")}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "type",
        accessorFn: (row) => typeLabel(row.Type),
        meta: { label: "Type" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Type" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "diagnosis",
        accessorFn: (row) => `${row.DiagnosisCode} - ${row.DiagnosisDesc}`,
        meta: { label: "Diagnosis" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Diagnosis" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "chiefComplaint",
        accessorKey: "ChiefComplaint",
        meta: { label: "Chief Complaint" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Chief Complaint" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "treatmentPlan",
        accessorKey: "TreatmentPlan",
        meta: { label: "Treatment Plan" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Treatment Plan" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <>
        <header className="mb-4">
          <h2 className="text-xl font-medium tracking-tight">My Medical Records</h2>
          <p className="text-sm text-muted-foreground">View your medical history.</p>
        </header>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Treatment Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
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
        <h2 className="text-xl font-medium tracking-tight">
          My Medical Records
        </h2>
        <p className="text-sm text-muted-foreground">
          View your medical history.
        </p>
      </header>

      <DataTable
        data={records}
        columns={columns}
        searchPlaceholder="Search records..."
        onRowClick={(record) => setSelected(record)}
      />

      <RecordDetail record={selected} onClose={() => setSelected(null)} />
    </>
  );
}
