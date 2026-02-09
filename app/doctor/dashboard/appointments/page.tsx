"use client";

import { useEffect, useState } from "react";

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
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
  { value: "no_show", label: "No Show" },
];

const statusColors: Record<string, string> = {
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
    const res = await fetch("/api/doctor/patients");
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
        <p className="text-sm text-zinc-500">Loading appointments...</p>
      </div>
    );
  }

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium tracking-tight">Appointments</h2>
          <p className="text-sm text-zinc-500">
            Manage your patient appointments.
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          {showForm ? "Cancel" : "New Appointment"}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6"
        >
          <h3 className="text-sm font-medium mb-4">
            {editing ? "Edit Appointment" : "New Appointment"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Patient
              </label>
              <select
                required
                disabled={!!editing}
                value={form.patientId}
                onChange={(e) =>
                  setForm({ ...form, patientId: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none disabled:opacity-50"
              >
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p.UserID} value={p.UserID}>
                    {p.FirstName} {p.LastName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Place
              </label>
              <input
                type="text"
                required
                value={form.place}
                onChange={(e) => setForm({ ...form, place: e.target.value })}
                placeholder="e.g. Room 204"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {editing && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value })
                  }
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Reason
              </label>
              <input
                type="text"
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Reason for visit"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none resize-none"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : editing
                  ? "Update Appointment"
                  : "Create Appointment"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Place
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-sm text-zinc-500"
                >
                  No appointments found. Create one to get started.
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr
                  key={appt.AppointmentID}
                  className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                    {formatDate(appt.Date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {formatTime(appt.StartTime)} - {formatTime(appt.EndTime)}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                    {appt.Patient.FirstName} {appt.Patient.LastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {typeLabel(appt.Type)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[appt.Status] || ""}`}
                    >
                      {
                        STATUS_OPTIONS.find((s) => s.value === appt.Status)
                          ?.label
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    {appt.Place}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(appt)}
                        className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(appt.AppointmentID)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
