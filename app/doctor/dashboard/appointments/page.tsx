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
  TableCellsIcon,
  CalendarDaysIcon,
  BellIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
import { AppointmentDetail } from "@/components/details/AppointmentDetail";
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
import { formatDate } from "@/lib/format";

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
  VisitSummary: string | null;
  ReminderSent: boolean;
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


function formatTime(timeStr: string) {
  const d = new Date(timeStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
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
  const [reminding, setReminding] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [selected, setSelected] = useState<Appointment | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("doctor-appt-view") as
      | "table"
      | "calendar"
      | null;
    if (saved) setView(saved);
  }, []);

  function setViewAndPersist(v: "table" | "calendar") {
    setView(v);
    sessionStorage.setItem("doctor-appt-view", v);
  }

  function handleChipEdit(id: string) {
    const appt = appointments.find((a) => a.AppointmentID === id);
    if (!appt) return;
    startEdit(appt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
    visitSummary: "",
  });

  const fetchAppointments = useCallback(async function fetchAppointments() {
    try {
      const res = await fetch("/api/doctor/appointments");
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments);
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
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments]);

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
      visitSummary: "",
    });
    setEditing(null);
    setShowForm(false);
  }

  const startEdit = useCallback(function startEdit(appt: Appointment) {
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
      visitSummary: appt.VisitSummary || "",
    });
    setEditing(appt);
    setShowForm(true);
  }, []);

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

  const handleDelete = useCallback(async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this appointment?")) return;

    const res = await fetch(`/api/doctor/appointments/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchAppointments();
    }
  }, [fetchAppointments]);

  const sendReminder = useCallback(async function sendReminder(id: string) {
    setReminding(id);
    try {
      const res = await fetch(`/api/doctor/appointments/${id}/remind`, {
        method: "POST",
      });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.AppointmentID === id ? { ...a, ReminderSent: true } : a,
          ),
        );
      }
    } finally {
      setReminding(null);
    }
  }, []);

  const columns = useMemo<ColumnDef<Appointment, unknown>[]>(
    () => [
      {
        id: "date",
        accessorFn: (row) => row.Date,
        sortingFn: "datetime",
        enableGlobalFilter: false,
        meta: { label: "Date" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Date" />
        ),
        cell: ({ row }) => formatDate(row.original.Date),
      },
      {
        id: "time",
        accessorFn: (row) => row.StartTime,
        sortingFn: "datetime",
        enableGlobalFilter: false,
        meta: { label: "Time" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Time" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatTime(row.original.StartTime)} -{" "}
            {formatTime(row.original.EndTime)}
          </span>
        ),
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
            {STATUS_OPTIONS.find((s) => s.value === row.original.Status)?.label}
          </Badge>
        ),
      },
      {
        id: "place",
        accessorKey: "Place",
        meta: { label: "Place" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Place" />
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
        cell: ({ row }) => {
          const appt = row.original;
          const canRemind = ["pending", "scheduled"].includes(appt.Status);
          const isSending = reminding === appt.AppointmentID;
          return (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => startEdit(appt)}
              >
                <PencilSquareIcon className="h-3.5 w-3.5" />
                Edit
              </Button>
              {canRemind && (
                <Button
                  variant="ghost"
                  size="xs"
                  disabled={isSending}
                  className={
                    appt.ReminderSent
                      ? "text-muted-foreground"
                      : "text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  }
                  onClick={() => sendReminder(appt.AppointmentID)}
                  title={appt.ReminderSent ? "Reminder already sent — click to resend" : "Send reminder email"}
                >
                  {appt.ReminderSent ? (
                    <BellAlertIcon className="h-3.5 w-3.5" />
                  ) : (
                    <BellIcon className="h-3.5 w-3.5" />
                  )}
                  {isSending ? "Sending…" : appt.ReminderSent ? "Resend" : "Remind"}
                </Button>
              )}
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
          );
        },
      },
    ],
    [startEdit, handleDelete, sendReminder, reminding],
  );

  if (loading) {
    return (
      <>
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-tight">Appointments</h2>
            <p className="text-sm text-muted-foreground">Manage your patient appointments.</p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-9 w-40" />
          </div>
        </header>
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
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
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
          <h2 className="text-xl font-medium tracking-tight">Appointments</h2>
          <p className="text-sm text-muted-foreground">
            Manage your patient appointments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border bg-background p-0.5 gap-0.5">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setViewAndPersist("table")}
              aria-label="Table view"
            >
              <TableCellsIcon className="h-3.5 w-3.5" />
              Table
            </Button>
            <Button
              variant={view === "calendar" ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setViewAndPersist("calendar")}
              aria-label="Calendar view"
            >
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              Calendar
            </Button>
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
        </div>
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
                {editing && form.status === "completed" && (
                  <div className="col-span-2 space-y-1.5">
                    <Label>Visit Summary (SOAP Note)</Label>
                    <Textarea
                      value={form.visitSummary}
                      onChange={(e) =>
                        setForm({ ...form, visitSummary: e.target.value })
                      }
                      rows={5}
                      placeholder="S: Subjective&#10;O: Objective&#10;A: Assessment&#10;P: Plan"
                    />
                  </div>
                )}
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

      {view === "calendar" ? (
        <AppointmentCalendar
          appointments={appointments}
          role="doctor"
          onEditAppt={handleChipEdit}
          onViewDetail={(appt) =>
            setSelected(appointments.find((a) => a.AppointmentID === appt.AppointmentID) ?? null)
          }
        />
      ) : (
        <DataTable
          data={appointments}
          columns={columns}
          searchPlaceholder="Search appointments..."
          onRowClick={(appt) => setSelected(appt)}
        />
      )}

      <AppointmentDetail
        appointment={selected}
        onClose={() => setSelected(null)}
        actions={
          selected && (
            <>
              {["pending", "scheduled"].includes(selected.Status) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reminding === selected.AppointmentID}
                  onClick={async () => {
                    await sendReminder(selected.AppointmentID);
                    // Sync ReminderSent state on the selected detail panel
                    setSelected((prev) =>
                      prev ? { ...prev, ReminderSent: true } : null,
                    );
                  }}
                >
                  {selected.ReminderSent ? (
                    <BellAlertIcon className="h-3.5 w-3.5" />
                  ) : (
                    <BellIcon className="h-3.5 w-3.5" />
                  )}
                  {reminding === selected.AppointmentID
                    ? "Sending…"
                    : selected.ReminderSent
                      ? "Resend Reminder"
                      : "Send Reminder"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(null);
                  startEdit(selected);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <PencilSquareIcon className="h-3.5 w-3.5" />
                Edit Appointment
              </Button>
            </>
          )
        }
      />
    </>
  );
}
