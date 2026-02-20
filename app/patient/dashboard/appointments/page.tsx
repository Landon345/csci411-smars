"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PlusIcon,
  XMarkIcon,
  TableCellsIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentDetail } from "@/components/details/AppointmentDetail";

interface Doctor {
  UserID: string;
  FirstName: string;
  LastName: string;
}

interface Appointment {
  AppointmentID: string;
  DoctorID: string;
  PatientID: string;
  Doctor: { FirstName: string; LastName: string };
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

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [selected, setSelected] = useState<Appointment | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("patient-appt-view") as
      | "table"
      | "calendar"
      | null;
    if (saved) setView(saved);
  }, []);

  function setViewAndPersist(v: "table" | "calendar") {
    setView(v);
    sessionStorage.setItem("patient-appt-view", v);
  }

  const [form, setForm] = useState({
    doctorId: "",
    date: "",
    startTime: "",
    reason: "",
    type: "checkup",
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  async function fetchAppointments() {
    try {
      const res = await fetch("/api/patient/appointments");
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDoctors() {
    const res = await fetch("/api/patient/doctors");
    if (!res.ok) return;
    const data = await res.json();
    setDoctors(data.doctors);
  }

  function resetForm() {
    setForm({
      doctorId: "",
      date: "",
      startTime: "",
      reason: "",
      type: "checkup",
    });
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) return;

      resetForm();
      await fetchAppointments();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    const res = await fetch(`/api/patient/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "canceled" }),
    });
    if (res.ok) {
      await fetchAppointments();
    }
  }

  if (loading) {
    return (
      <>
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-medium tracking-tight">My Appointments</h2>
            <p className="text-sm text-muted-foreground">View your appointments and request new ones.</p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-9 w-44" />
          </div>
        </header>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Doctor</TableHead>
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
                  <TableCell><Skeleton className="h-7 w-16" /></TableCell>
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
            My Appointments
          </h2>
          <p className="text-sm text-muted-foreground">
            View your appointments and request new ones.
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
              <>
                <XMarkIcon className="h-4 w-4" /> Cancel
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4" /> Request Appointment
              </>
            )}
          </Button>
        </div>
      </header>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Request Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Doctor</Label>
                  <select
                    required
                    value={form.doctorId}
                    onChange={(e) =>
                      setForm({ ...form, doctorId: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                  >
                    <option value="">Select doctor...</option>
                    {doctors.map((d) => (
                      <option key={d.UserID} value={d.UserID}>
                        Dr. {d.FirstName} {d.LastName}
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
                  <Label>Preferred Time</Label>
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
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {view === "calendar" ? (
        <AppointmentCalendar
          appointments={appointments}
          role="patient"
          onCancelAppt={handleCancel}
          onViewDetail={(appt) =>
            setSelected(appointments.find((a) => a.AppointmentID === appt.AppointmentID) ?? null)
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Doctor</TableHead>
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
                    No appointments found. Request one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt) => (
                  <TableRow
                    key={appt.AppointmentID}
                    className="cursor-pointer"
                    onClick={() => setSelected(appt)}
                  >
                    <TableCell>{formatDate(appt.Date)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(appt.StartTime)} - {formatTime(appt.EndTime)}
                    </TableCell>
                    <TableCell className="font-medium">
                      Dr. {appt.Doctor.FirstName} {appt.Doctor.LastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {typeLabel(appt.Type)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusVariant[appt.Status] || ""}
                      >
                        {STATUS_OPTIONS.find((s) => s.value === appt.Status)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {appt.Place}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {(appt.Status === "scheduled" ||
                        appt.Status === "pending") && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleCancel(appt.AppointmentID)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <AppointmentDetail appointment={selected} onClose={() => setSelected(null)} />
    </>
  );
}
