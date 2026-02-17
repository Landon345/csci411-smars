"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

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

  useEffect(() => {
    fetchRecords();
    fetchPatients();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch("/api/doctor/records");
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPatients() {
    const res = await fetch("/api/doctor/patients");
    if (!res.ok) return;
    const data = await res.json();
    setPatients(data.patients);
  }

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

  function startEdit(record: MedicalRecord) {
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
  }

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

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this record?")) return;

    const res = await fetch(`/api/doctor/records/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchRecords();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading records...</p>
      </div>
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
            {records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No records found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.RecordID}>
                  <TableCell>{formatDate(record.VisitDate)}</TableCell>
                  <TableCell className="font-medium">
                    {record.Patient.FirstName} {record.Patient.LastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeLabel(record.Type)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.DiagnosisCode} - {record.DiagnosisDesc}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.ChiefComplaint}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => startEdit(record)}
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(record.RecordID)}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
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
