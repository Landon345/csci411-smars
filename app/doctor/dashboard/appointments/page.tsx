"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

interface Appointment {
  AppointmentID: string;
  DoctorID: string;
  PatientID: string;
  Patient: { FirstName: string; LastName: string };
  Date: string;
  StartTime: string;
  EndTime: string;
  Place: string;
  Reason: string;
  Type: string;
  Status: string;
  Notes: string | null;
  CanceledBy: string | null;
}

const TYPE_OPTIONS = [
  { value: "checkup", label: "Checkup" },
  { value: "follow_up", label: "Follow-up" },
  { value: "consultation", label: "Consultation" },
  { value: "procedure", label: "Procedure" },
  { value: "emergency", label: "Emergency" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
  { value: "no_show", label: "No Show" },
];

const statusVariant: Record<string, string> = {
  pending:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  scheduled:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  no_show:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function formatTime(timeStr: string) {
  const d = new Date(timeStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function typeLabel(type: string) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    patientId: "",
    date: "",
    startTime: "",
    endTime: "",
    place: "",
    reason: "",
    type: "checkup",
    status: "scheduled",
    notes: "",
  });

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  async function fetchAppointments() {
    try {
      const res = await fetch("/api/doctor/appointments");
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPatients() {
    const res = await fetch("/api/doctor/patients/search");
    if (!res.ok) return;
    const data = await res.json();
    setPatients(data.patients);
  }

  function resetForm() {
    setForm({
      patientId: "",
      date: "",
      startTime: "",
      endTime: "",
      place: "",
      reason: "",
      type: "checkup",
      status: "scheduled",
      notes: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(appt: Appointment) {
    setForm({
      patientId: appt.PatientID,
      date: new Date(appt.Date).toISOString().split("T")[0],
      startTime: formatTime24(appt.StartTime),
      endTime: formatTime24(appt.EndTime),
      place: appt.Place,
      reason: appt.Reason,
      type: appt.Type,
      status: appt.Status,
      notes: appt.Notes || "",
    });
    setEditing(appt);
    setShowForm(true);
  }

  function formatTime24(timeStr: string) {
    const d = new Date(timeStr);
    return d.toTimeString().slice(0, 5);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editing) {
        const res = await fetch(
          `/api/doctor/appointments/${editing.AppointmentID}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          },
        );
        if (!res.ok) return;
      } else {
        const res = await fetch("/api/doctor/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) return;
      }

      resetForm();
      await fetchAppointments();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    const res = await fetch(`/api/doctor/appointments/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchAppointments();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading appointments...</p>
      </div>
    );
  }

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium tracking-tight">Appointments</h2>
          <p className="text-sm text-muted-foreground">
            Manage your patient appointments.
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
            <><XMarkIcon className="h-4 w-4" /> Cancel</>
          ) : (
            <><PlusIcon className="h-4 w-4" /> New Appointment</>
          )}
        </Button>
      </header>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {editing ? "Edit Appointment" : "New Appointment"}
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
                  <Label>Date</Label>
                  <Input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({ ...form, endTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Place</Label>
                  <Input
                    type="text"
                    required
                    value={form.place}
                    onChange={(e) =>
                      setForm({ ...form, place: e.target.value })
                    }
                    placeholder="e.g. Room 204"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
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
                {editing && (
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
                )}
                <div className="col-span-2 space-y-1.5">
                  <Label>Reason</Label>
                  <Input
                    type="text"
                    required
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                    placeholder="Reason for visit"
                  />
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
                      ? "Update Appointment"
                      : "Create Appointment"}
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
              <TableHead>Time</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Place</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No appointments found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appt) => (
                <TableRow key={appt.AppointmentID}>
                  <TableCell>
                    {formatDate(appt.Date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatTime(appt.StartTime)} - {formatTime(appt.EndTime)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {appt.Patient.FirstName} {appt.Patient.LastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeLabel(appt.Type)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusVariant[appt.Status] || ""}
                    >
                      {
                        STATUS_OPTIONS.find((s) => s.value === appt.Status)
                          ?.label
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {appt.Place}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => startEdit(appt)}
                      >
                        <PencilSquareIcon className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(appt.AppointmentID)}
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
