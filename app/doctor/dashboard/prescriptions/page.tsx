"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  PlusIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { PrescriptionDetail } from "@/components/details/PrescriptionDetail";
import { formatDate } from "@/lib/format";

interface Patient {
  UserID: string;
  FirstName: string;
  LastName: string;
}

interface Prescription {
  PrescriptionID: string;
  DoctorID: string;
  PatientID: string;
  Patient: { FirstName: string; LastName: string };
  Medication: string;
  Dosage: string;
  Frequency: string;
  Duration: string;
  Refills: number;
  StartDate: string;
  EndDate: string | null;
  Status: string;
  Notes: string | null;
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


export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Prescription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Prescription | null>(null);

  const [form, setForm] = useState({
    patientId: "",
    medication: "",
    dosage: "",
    frequency: "",
    duration: "",
    refills: "0",
    startDate: "",
    endDate: "",
    status: "active",
    notes: "",
  });

  const fetchPrescriptions = useCallback(async function fetchPrescriptions() {
    try {
      const res = await fetch("/api/doctor/prescriptions");
      if (!res.ok) return;
      const data = await res.json();
      setPrescriptions(data.prescriptions);
    } finally {
      setLoading(false);
    }
  }, []);

  async function fetchPatients() {
    const res = await fetch("/api/doctor/patients/search");
    if (!res.ok) return;
    const data = await res.json();
    setPatients(data.patients);
  }

  useEffect(() => {
    fetchPrescriptions();
    fetchPatients();
  }, [fetchPrescriptions]);

  function resetForm() {
    setForm({
      patientId: "",
      medication: "",
      dosage: "",
      frequency: "",
      duration: "",
      refills: "0",
      startDate: "",
      endDate: "",
      status: "active",
      notes: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  const startEdit = useCallback(function startEdit(rx: Prescription) {
    setForm({
      patientId: rx.PatientID,
      medication: rx.Medication,
      dosage: rx.Dosage,
      frequency: rx.Frequency,
      duration: rx.Duration,
      refills: rx.Refills.toString(),
      startDate: new Date(rx.StartDate).toISOString().split("T")[0],
      endDate: rx.EndDate
        ? new Date(rx.EndDate).toISOString().split("T")[0]
        : "",
      status: rx.Status,
      notes: rx.Notes || "",
    });
    setEditing(rx);
    setShowForm(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editing) {
        const res = await fetch(
          `/api/doctor/prescriptions/${editing.PrescriptionID}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          },
        );
        if (!res.ok) return;
      } else {
        const res = await fetch("/api/doctor/prescriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) return;
      }

      resetForm();
      await fetchPrescriptions();
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = useCallback(async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this prescription?")) return;

    const res = await fetch(`/api/doctor/prescriptions/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchPrescriptions();
    }
  }, [fetchPrescriptions]);

  const columns = useMemo<ColumnDef<Prescription, unknown>[]>(
    () => [
      {
        id: "patient",
        accessorFn: (row) =>
          `${row.Patient.FirstName} ${row.Patient.LastName}`,
        meta: { label: "Patient" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Patient" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/doctor/dashboard/patients/${row.original.PatientID}`}
            className="font-medium hover:underline"
          >
            {row.original.Patient.FirstName} {row.original.Patient.LastName}
          </Link>
        ),
      },
      {
        id: "medication",
        accessorKey: "Medication",
        meta: { label: "Medication" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Medication" />
        ),
        cell: ({ getValue }) => getValue() as string,
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
      {
        id: "actions",
        enableSorting: false,
        enableGlobalFilter: false,
        meta: { label: "Actions" },
        header: () => <span>Actions</span>,
        cell: ({ row }) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => startEdit(row.original)}
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(row.original.PrescriptionID)}
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [startEdit, handleDelete],
  );

  if (loading) {
    return (
      <>
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-tight">Prescriptions</h2>
            <p className="text-sm text-muted-foreground">Manage your patient prescriptions.</p>
          </div>
          <Skeleton className="h-9 w-40" />
        </header>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-28" /></TableCell>
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
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium tracking-tight">Prescriptions</h2>
          <p className="text-sm text-muted-foreground">
            Manage your patient prescriptions.
          </p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? (
            <>
              <XMarkIcon className="h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" /> New Prescription
            </>
          )}
        </Button>
      </header>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {editing ? "Edit Prescription" : "New Prescription"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Patient</Label>
                  <select
                    required
                    disabled={!!editing}
                    value={form.patientId}
                    onChange={(e) =>
                      setForm({ ...form, patientId: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none disabled:opacity-50"
                  >
                    <option value="">Select patient...</option>
                    {patients.map((p) => (
                      <option key={p.UserID} value={p.UserID}>
                        {p.FirstName} {p.LastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Medication</Label>
                  <Input
                    type="text"
                    required
                    value={form.medication}
                    onChange={(e) =>
                      setForm({ ...form, medication: e.target.value })
                    }
                    placeholder="e.g. Amoxicillin"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Dosage</Label>
                  <Input
                    type="text"
                    required
                    value={form.dosage}
                    onChange={(e) =>
                      setForm({ ...form, dosage: e.target.value })
                    }
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Input
                    type="text"
                    required
                    value={form.frequency}
                    onChange={(e) =>
                      setForm({ ...form, frequency: e.target.value })
                    }
                    placeholder="e.g. Twice daily"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Input
                    type="text"
                    required
                    value={form.duration}
                    onChange={(e) =>
                      setForm({ ...form, duration: e.target.value })
                    }
                    placeholder="e.g. 10 days"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Refills</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.refills}
                    onChange={(e) =>
                      setForm({ ...form, refills: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editing
                      ? "Update Prescription"
                      : "Create Prescription"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={prescriptions}
        columns={columns}
        searchPlaceholder="Search prescriptions..."
        onRowClick={(rx) => setSelected(rx)}
      />

      <PrescriptionDetail prescription={selected} onClose={() => setSelected(null)} />
    </>
  );
}
