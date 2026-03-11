"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PlusIcon,
  TableCellsIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { AppointmentCalendar } from "@/components/appointments/AppointmentCalendar";
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
import { AppointmentDetail } from "@/components/details/AppointmentDetail";
import { formatDate } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BookAppointmentModal } from "@/components/appointments/BookAppointmentModal";

interface DoctorProfile {
  ClinicalCategory: string | null;
  Specialty: string | null;
  Degree: string | null;
  BoardCertified: boolean;
  SubSpecialties: string[];
  Bio: string | null;
  Telehealth: boolean;
}

interface Doctor {
  UserID: string;
  FirstName: string;
  LastName: string;
  DoctorProfile: DoctorProfile | null;
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

function formatTime(timeStr: string) {
  const d = new Date(timeStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}

function typeLabel(type: string) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

function PatientAppointmentsContent() {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

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

  const fetchAppointments = useCallback(async function fetchAppointments() {
    try {
      const res = await fetch("/api/patient/appointments");
      if (!res.ok) return;
      const data = await res.json();
      setAppointments(data.appointments);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    fetch("/api/patient/doctors")
      .then((r) => r.json())
      .then(({ doctors }) => setDoctors(doctors ?? []));
  }, [fetchAppointments]);

  // Handle ?doctor= param — open booking modal directly for that doctor
  useEffect(() => {
    const doctorId = searchParams.get("doctor");
    if (doctorId && doctors.length > 0) {
      const found = doctors.find((d) => d.UserID === doctorId);
      if (found) setBookingDoctor(found);
    }
  }, [searchParams, doctors]);

  const handleCancel = useCallback(async function handleCancel(id: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    const res = await fetch(`/api/patient/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "canceled" }),
    });
    if (res.ok) {
      await fetchAppointments();
    }
  }, [fetchAppointments]);

  const filteredDoctors = pickerSearch
    ? doctors.filter((d) =>
        `${d.FirstName} ${d.LastName}`
          .toLowerCase()
          .includes(pickerSearch.toLowerCase())
      )
    : doctors;

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
        cell: ({ row }) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {(row.original.Status === "scheduled" ||
              row.original.Status === "pending") && (
              <Button
                variant="ghost"
                size="xs"
                className="text-destructive hover:text-destructive"
                onClick={() => handleCancel(row.original.AppointmentID)}
              >
                Cancel
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleCancel],
  );

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
          <Button onClick={() => setPickerOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Request Appointment
          </Button>
        </div>
      </header>

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
        <DataTable
          data={appointments}
          columns={columns}
          searchPlaceholder="Search appointments..."
          onRowClick={(appt) => setSelected(appt)}
          initialFilter={searchParam}
        />
      )}

      {/* Doctor picker modal */}
      <Dialog open={pickerOpen} onOpenChange={(open) => {
        setPickerOpen(open);
        if (!open) setPickerSearch("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose a Doctor</DialogTitle>
            <DialogDescription>
              Select a doctor to book an appointment with.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Input
              placeholder="Search by name..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              className="mb-3"
            />
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {filteredDoctors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No doctors found.</p>
              ) : (
                filteredDoctors.map((d) => (
                  <button
                    key={d.UserID}
                    className="w-full text-left rounded-lg border px-4 py-3 hover:bg-accent transition-colors"
                    onClick={() => {
                      setBookingDoctor(d);
                      setPickerOpen(false);
                      setPickerSearch("");
                    }}
                  >
                    <p className="font-medium text-sm">
                      Dr. {d.FirstName} {d.LastName}
                      {d.DoctorProfile?.Degree ? (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                          {d.DoctorProfile.Degree}
                        </span>
                      ) : null}
                    </p>
                    {d.DoctorProfile?.Specialty && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.DoctorProfile.Specialty}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Booking modal */}
      <BookAppointmentModal
        doctor={bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        onBooked={() => {
          setBookingDoctor(null);
          fetchAppointments();
        }}
      />

      <AppointmentDetail appointment={selected} onClose={() => setSelected(null)} />
    </>
  );
}

export default function PatientAppointmentsPage() {
  return (
    <Suspense>
      <PatientAppointmentsContent />
    </Suspense>
  );
}
