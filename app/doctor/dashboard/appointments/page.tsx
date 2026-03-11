"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import {
  DoctorAppointmentModal,
  type ModalAppointment,
} from "@/components/appointments/DoctorAppointmentModal";
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

function toModalAppointment(a: Appointment): ModalAppointment {
  return {
    AppointmentID: a.AppointmentID,
    PatientID: a.PatientID,
    Date: a.Date,
    StartTime: a.StartTime,
    EndTime: a.EndTime,
    Place: a.Place,
    Reason: a.Reason,
    Type: a.Type,
    Status: a.Status,
    Notes: a.Notes,
    VisitSummary: a.VisitSummary,
  };
}

function AppointmentsPageContent() {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const filterParam = searchParams.get("filter") ?? "";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppt, setEditingAppt] = useState<ModalAppointment | null>(null);

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

  function openNew() {
    setEditingAppt(null);
    setModalOpen(true);
  }

  const openEdit = useCallback(function openEdit(appt: Appointment) {
    setEditingAppt(toModalAppointment(appt));
    setModalOpen(true);
  }, []);

  function handleChipEdit(id: string) {
    const appt = appointments.find((a) => a.AppointmentID === id);
    if (appt) openEdit(appt);
  }

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

  const handleDelete = useCallback(async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    const res = await fetch(`/api/doctor/appointments/${id}`, { method: "DELETE" });
    if (res.ok) await fetchAppointments();
  }, [fetchAppointments]);

  const sendReminder = useCallback(async function sendReminder(id: string) {
    setReminding(id);
    try {
      const res = await fetch(`/api/doctor/appointments/${id}/remind`, { method: "POST" });
      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) => (a.AppointmentID === id ? { ...a, ReminderSent: true } : a)),
        );
      }
    } finally {
      setReminding(null);
    }
  }, []);

  const displayedAppointments = useMemo(() => {
    if (filterParam === "today") {
      const todayStr = new Date().toISOString().split("T")[0];
      return appointments.filter((a) => a.Date.startsWith(todayStr));
    }
    if (filterParam === "recent") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3);
      cutoff.setHours(0, 0, 0, 0);
      return appointments.filter(
        (a) => new Date(a.Date) >= cutoff && a.Status === "completed",
      );
    }
    return appointments;
  }, [appointments, filterParam]);

  const filterLabel =
    filterParam === "today"
      ? "Today's appointments"
      : filterParam === "recent"
        ? "Last 3 days"
        : null;

  const effectiveInitialFilter =
    searchParam || (filterParam === "recent" ? "completed" : "");

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
            {formatTime(row.original.StartTime)} –{" "}
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
                onClick={() => openEdit(appt)}
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
    [openEdit, handleDelete, sendReminder, reminding],
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
          <Button onClick={openNew}>
            <PlusIcon className="h-4 w-4" />
            New Appointment
          </Button>
        </div>
      </header>

      {filterLabel && (
        <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted/40 px-4 py-2 text-sm">
          <span className="text-muted-foreground">Filtered:</span>
          <Badge variant="secondary">{filterLabel}</Badge>
          <Link
            href="/doctor/dashboard/appointments"
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
            Clear
          </Link>
        </div>
      )}

      {view === "calendar" ? (
        <AppointmentCalendar
          appointments={displayedAppointments}
          role="doctor"
          onEditAppt={handleChipEdit}
          onViewDetail={(appt) =>
            setSelected(appointments.find((a) => a.AppointmentID === appt.AppointmentID) ?? null)
          }
        />
      ) : (
        <DataTable
          data={displayedAppointments}
          columns={columns}
          searchPlaceholder="Search appointments…"
          onRowClick={(appt) => setSelected(appt)}
          initialFilter={effectiveInitialFilter}
        />
      )}

      <DoctorAppointmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAppointments}
        patients={patients}
        editing={editingAppt}
        existingAppointments={appointments.map(toModalAppointment)}
      />

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
                  openEdit(selected);
                  setSelected(null);
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

export default function AppointmentsPage() {
  return (
    <Suspense>
      <AppointmentsPageContent />
    </Suspense>
  );
}
