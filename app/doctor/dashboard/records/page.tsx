"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { RecordDetail } from "@/components/details/RecordDetail";
import { formatDate } from "@/lib/format";

interface Patient {
  UserID: string;
  FirstName: string;
  LastName: string;
}

interface MedicalRecord {
  RecordID: string;
  DoctorID: string;
  PatientID: string;
  Patient: { FirstName: string; LastName: string };
  VisitDate: string;
  ChiefComplaint: string;
  DiagnosisCode: string;
  DiagnosisDesc: string;
  TreatmentPlan: string;
  HeartRate: number | null;
  BloodPressure: string | null;
  Temperature: number | null;
  Weight: number | null;
  Height: number | null;
  FollowUp: string | null;
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

export default function DoctorRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MedicalRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<MedicalRecord | null>(null);

  const [form, setForm] = useState({
    patientId: "",
    visitDate: "",
    type: "office_visit",
    diagnosisCode: "",
    chiefComplaint: "",
    diagnosisDesc: "",
    heartRate: "",
    bloodPressure: "",
    temperature: "",
    weight: "",
    height: "",
    treatmentPlan: "",
    followUp: "",
  });

  const fetchRecords = useCallback(async function fetchRecords() {
    try {
      const res = await fetch("/api/doctor/records");
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records);
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
    fetchRecords();
    fetchPatients();
  }, [fetchRecords]);

  function resetForm() {
    setForm({
      patientId: "",
      visitDate: "",
      type: "office_visit",
      diagnosisCode: "",
      chiefComplaint: "",
      diagnosisDesc: "",
      heartRate: "",
      bloodPressure: "",
      temperature: "",
      weight: "",
      height: "",
      treatmentPlan: "",
      followUp: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  const startEdit = useCallback(function startEdit(record: MedicalRecord) {
    setForm({
      patientId: record.PatientID,
      visitDate: new Date(record.VisitDate).toISOString().split("T")[0],
      type: record.Type,
      diagnosisCode: record.DiagnosisCode,
      chiefComplaint: record.ChiefComplaint,
      diagnosisDesc: record.DiagnosisDesc,
      heartRate: record.HeartRate?.toString() || "",
      bloodPressure: record.BloodPressure || "",
      temperature: record.Temperature?.toString() || "",
      weight: record.Weight?.toString() || "",
      height: record.Height?.toString() || "",
      treatmentPlan: record.TreatmentPlan,
      followUp: record.FollowUp || "",
    });
    setEditing(record);
    setShowForm(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editing) {
        const res = await fetch(`/api/doctor/records/${editing.RecordID}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) return;
      } else {
        const res = await fetch("/api/doctor/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) return;
      }

      resetForm();
      await fetchRecords();
    } finally {
      setSubmitting(false);
    }
  }

  const handleDelete = useCallback(async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this record?")) return;

    const res = await fetch(`/api/doctor/records/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchRecords();
    }
  }, [fetchRecords]);

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
              onClick={() => handleDelete(row.original.RecordID)}
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
            <h2 className="text-xl font-medium tracking-tight">Medical Records</h2>
            <p className="text-sm text-muted-foreground">Manage your patient medical records.</p>
          </div>
          <Skeleton className="h-9 w-32" />
        </header>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
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
          <h2 className="text-xl font-medium tracking-tight">
            Medical Records
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your patient medical records.
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
              <PlusIcon className="h-4 w-4" /> New Record
            </>
          )}
        </Button>
      </header>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {editing ? "Edit Record" : "New Record"}
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
                  <Label>Visit Date</Label>
                  <Input
                    type="date"
                    required
                    value={form.visitDate}
                    onChange={(e) =>
                      setForm({ ...form, visitDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Record Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>ICD-10 Code</Label>
                  <Input
                    type="text"
                    required
                    value={form.diagnosisCode}
                    onChange={(e) =>
                      setForm({ ...form, diagnosisCode: e.target.value })
                    }
                    placeholder="e.g. J06.9"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Chief Complaint</Label>
                  <Input
                    type="text"
                    required
                    value={form.chiefComplaint}
                    onChange={(e) =>
                      setForm({ ...form, chiefComplaint: e.target.value })
                    }
                    placeholder="Primary reason for visit"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Diagnosis Description</Label>
                  <Input
                    type="text"
                    required
                    value={form.diagnosisDesc}
                    onChange={(e) =>
                      setForm({ ...form, diagnosisDesc: e.target.value })
                    }
                    placeholder="Diagnosis details"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Heart Rate (bpm)</Label>
                  <Input
                    type="number"
                    value={form.heartRate}
                    onChange={(e) =>
                      setForm({ ...form, heartRate: e.target.value })
                    }
                    placeholder="e.g. 72"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Blood Pressure</Label>
                  <Input
                    type="text"
                    value={form.bloodPressure}
                    onChange={(e) =>
                      setForm({ ...form, bloodPressure: e.target.value })
                    }
                    placeholder="e.g. 120/80"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Temperature (F)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.temperature}
                    onChange={(e) =>
                      setForm({ ...form, temperature: e.target.value })
                    }
                    placeholder="e.g. 98.6"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Weight (lbs)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: e.target.value })
                    }
                    placeholder="e.g. 165.0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Height (in)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.height}
                    onChange={(e) =>
                      setForm({ ...form, height: e.target.value })
                    }
                    placeholder="e.g. 70.0"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Treatment Plan</Label>
                  <Textarea
                    required
                    value={form.treatmentPlan}
                    onChange={(e) =>
                      setForm({ ...form, treatmentPlan: e.target.value })
                    }
                    rows={3}
                    placeholder="Treatment plan details..."
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Follow-Up Instructions (optional)</Label>
                  <Textarea
                    value={form.followUp}
                    onChange={(e) =>
                      setForm({ ...form, followUp: e.target.value })
                    }
                    rows={3}
                    placeholder="Follow-up instructions..."
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
                      ? "Update Record"
                      : "Create Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
