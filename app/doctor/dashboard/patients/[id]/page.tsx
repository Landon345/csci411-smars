"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { AppointmentDetail } from "@/components/details/AppointmentDetail";
import { RecordDetail } from "@/components/details/RecordDetail";
import { PrescriptionDetail } from "@/components/details/PrescriptionDetail";

interface Patient {
  UserID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string | null;
}

interface Appointment {
  AppointmentID: string;
  DoctorID: string;
  PatientID: string;
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
}

interface MedicalRecord {
  RecordID: string;
  DoctorID: string;
  PatientID: string;
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

interface Prescription {
  PrescriptionID: string;
  DoctorID: string;
  PatientID: string;
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

const APPT_TYPE_OPTIONS = [
  { value: "checkup", label: "Checkup" },
  { value: "follow_up", label: "Follow-up" },
  { value: "consultation", label: "Consultation" },
  { value: "procedure", label: "Procedure" },
  { value: "emergency", label: "Emergency" },
];

const APPT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
  { value: "no_show", label: "No Show" },
];

const RECORD_TYPE_OPTIONS = [
  { value: "office_visit", label: "Office Visit" },
  { value: "lab_result", label: "Lab Result" },
  { value: "imaging", label: "Imaging" },
  { value: "referral", label: "Referral" },
  { value: "procedure_note", label: "Procedure Note" },
];

const PRESCRIPTION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "discontinued", label: "Discontinued" },
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

const rxStatusVariant: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  discontinued:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};


function formatTime(timeStr: string) {
  return new Date(timeStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime24(timeStr: string) {
  return new Date(timeStr).toTimeString().slice(0, 5);
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail view state
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  // Appointment edit state
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [apptForm, setApptForm] = useState({
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

  // Record edit state
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(
    null,
  );
  const [recordSubmitting, setRecordSubmitting] = useState(false);
  const [recordForm, setRecordForm] = useState({
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

  // Prescription edit state
  const [editingRx, setEditingRx] = useState<Prescription | null>(null);
  const [rxSubmitting, setRxSubmitting] = useState(false);
  const [rxForm, setRxForm] = useState({
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

  useEffect(() => {
    fetchAll();
  }, [id]);

  async function fetchAll() {
    try {
      const [patientRes, apptRes, recordRes, rxRes] = await Promise.all([
        fetch(`/api/doctor/patients/${id}`),
        fetch(`/api/doctor/appointments?patientId=${id}`),
        fetch(`/api/doctor/records?patientId=${id}`),
        fetch(`/api/doctor/prescriptions?patientId=${id}`),
      ]);

      if (!patientRes.ok) {
        router.push("/doctor/dashboard/patients");
        return;
      }

      const patientData = await patientRes.json();
      setPatient(patientData.patient);

      if (apptRes.ok) {
        const apptData = await apptRes.json();
        setAppointments(apptData.appointments);
      }

      if (recordRes.ok) {
        const recordData = await recordRes.json();
        setRecords(recordData.records);
      }

      if (rxRes.ok) {
        const rxData = await rxRes.json();
        setPrescriptions(rxData.prescriptions);
      }
    } finally {
      setLoading(false);
    }
  }

  // --- Appointment edit/delete ---

  function startEditAppt(appt: Appointment) {
    setApptForm({
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
    setEditingAppt(appt);
  }

  function cancelEditAppt() {
    setEditingAppt(null);
  }

  async function handleApptSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAppt) return;
    setApptSubmitting(true);

    try {
      const res = await fetch(
        `/api/doctor/appointments/${editingAppt.AppointmentID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apptForm),
        },
      );
      if (!res.ok) return;
      cancelEditAppt();
      await fetchAll();
    } finally {
      setApptSubmitting(false);
    }
  }

  async function handleDeleteAppt(apptId: string) {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    const res = await fetch(`/api/doctor/appointments/${apptId}`, {
      method: "DELETE",
    });
    if (res.ok) await fetchAll();
  }

  // --- Record edit/delete ---

  function startEditRecord(record: MedicalRecord) {
    setRecordForm({
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
    setEditingRecord(record);
  }

  function cancelEditRecord() {
    setEditingRecord(null);
  }

  async function handleRecordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRecord) return;
    setRecordSubmitting(true);

    try {
      const res = await fetch(
        `/api/doctor/records/${editingRecord.RecordID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(recordForm),
        },
      );
      if (!res.ok) return;
      cancelEditRecord();
      await fetchAll();
    } finally {
      setRecordSubmitting(false);
    }
  }

  async function handleDeleteRecord(recordId: string) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const res = await fetch(`/api/doctor/records/${recordId}`, {
      method: "DELETE",
    });
    if (res.ok) await fetchAll();
  }

  // --- Prescription edit/delete ---

  function startEditRx(rx: Prescription) {
    setRxForm({
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
    setEditingRx(rx);
  }

  function cancelEditRx() {
    setEditingRx(null);
  }

  async function handleRxSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRx) return;
    setRxSubmitting(true);

    try {
      const res = await fetch(
        `/api/doctor/prescriptions/${editingRx.PrescriptionID}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rxForm),
        },
      );
      if (!res.ok) return;
      cancelEditRx();
      await fetchAll();
    } finally {
      setRxSubmitting(false);
    }
  }

  async function handleDeleteRx(rxId: string) {
    if (!confirm("Are you sure you want to delete this prescription?")) return;
    const res = await fetch(`/api/doctor/prescriptions/${rxId}`, {
      method: "DELETE",
    });
    if (res.ok) await fetchAll();
  }

  if (loading) {
    return (
      <>
        <header className="mb-8">
          <span className="text-sm text-muted-foreground">&larr; Back to Patient List</span>
          <Skeleton className="h-8 w-52 mt-2 mb-1.5" />
          <Skeleton className="h-4 w-64" />
        </header>

        {/* Appointments skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-28" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Medical Records skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Medical Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Chief Complaint</TableHead>
                  <TableHead>Treatment Plan</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-7 w-28" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Prescriptions skeleton */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Prescriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
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
          </CardContent>
        </Card>
      </>
    );
  }

  if (!patient) return null;

  return (
    <>
      <header className="mb-8">
        <Link
          href="/doctor/dashboard/patients"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; Back to Patient List
        </Link>
        <h1 className="text-2xl font-medium tracking-tight mt-2">
          {patient.FirstName} {patient.LastName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {patient.Email}
          {patient.Phone ? ` · ${patient.Phone}` : ""}
        </p>
      </header>

      {/* Appointment Edit Form */}
      {editingAppt && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Edit Appointment
            </CardTitle>
            <Button variant="ghost" size="xs" onClick={cancelEditAppt}>
              <XMarkIcon className="h-4 w-4" /> Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApptSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    required
                    value={apptForm.date}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    required
                    value={apptForm.startTime}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, startTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    required
                    value={apptForm.endTime}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, endTime: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Place</Label>
                  <Input
                    type="text"
                    required
                    value={apptForm.place}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, place: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <select
                    value={apptForm.type}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, type: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                  >
                    {APPT_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    value={apptForm.status}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, status: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                  >
                    {APPT_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Reason</Label>
                  <Input
                    type="text"
                    required
                    value={apptForm.reason}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, reason: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={apptForm.notes}
                    onChange={(e) =>
                      setApptForm({ ...apptForm, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                {apptForm.status === "completed" && (
                  <div className="col-span-2 space-y-1.5">
                    <Label>Visit Summary (SOAP Note)</Label>
                    <Textarea
                      value={apptForm.visitSummary}
                      onChange={(e) =>
                        setApptForm({ ...apptForm, visitSummary: e.target.value })
                      }
                      rows={5}
                      placeholder="S: Subjective&#10;O: Objective&#10;A: Assessment&#10;P: Plan"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditAppt}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={apptSubmitting}>
                  {apptSubmitting ? "Saving..." : "Update Appointment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Appointments */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
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
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No appointments found.
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appt) => (
                  <TableRow
                    key={appt.AppointmentID}
                    className="cursor-pointer"
                    onClick={() => setSelectedAppt(appt)}
                  >
                    <TableCell>{formatDate(appt.Date)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatTime(appt.StartTime)}
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {APPT_TYPE_OPTIONS.find((t) => t.value === appt.Type)
                        ?.label ?? appt.Type}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={statusVariant[appt.Status] || ""}
                      >
                        {APPT_STATUS_OPTIONS.find(
                          (s) => s.value === appt.Status,
                        )?.label ?? appt.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {appt.Place}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => startEditAppt(appt)}
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAppt(appt.AppointmentID)}
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
        </CardContent>
      </Card>

      {/* Record Edit Form */}
      {editingRecord && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Edit Record</CardTitle>
            <Button variant="ghost" size="xs" onClick={cancelEditRecord}>
              <XMarkIcon className="h-4 w-4" /> Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecordSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Visit Date</Label>
                  <Input
                    type="date"
                    required
                    value={recordForm.visitDate}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        visitDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Record Type</Label>
                  <select
                    value={recordForm.type}
                    onChange={(e) =>
                      setRecordForm({ ...recordForm, type: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                  >
                    {RECORD_TYPE_OPTIONS.map((t) => (
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
                    value={recordForm.diagnosisCode}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        diagnosisCode: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Heart Rate (bpm)</Label>
                  <Input
                    type="number"
                    value={recordForm.heartRate}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        heartRate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Chief Complaint</Label>
                  <Input
                    type="text"
                    required
                    value={recordForm.chiefComplaint}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        chiefComplaint: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Diagnosis Description</Label>
                  <Input
                    type="text"
                    required
                    value={recordForm.diagnosisDesc}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        diagnosisDesc: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Blood Pressure</Label>
                  <Input
                    type="text"
                    value={recordForm.bloodPressure}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        bloodPressure: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Temperature (F)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={recordForm.temperature}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        temperature: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Weight (lbs)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={recordForm.weight}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        weight: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Height (in)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={recordForm.height}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        height: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Treatment Plan</Label>
                  <Textarea
                    required
                    value={recordForm.treatmentPlan}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        treatmentPlan: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Follow-Up Instructions (optional)</Label>
                  <Textarea
                    value={recordForm.followUp}
                    onChange={(e) =>
                      setRecordForm({
                        ...recordForm,
                        followUp: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditRecord}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={recordSubmitting}>
                  {recordSubmitting ? "Saving..." : "Update Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Medical Records */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Treatment Plan</TableHead>
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
                    No medical records found.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow
                    key={record.RecordID}
                    className="cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <TableCell>{formatDate(record.VisitDate)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {RECORD_TYPE_OPTIONS.find((t) => t.value === record.Type)
                        ?.label ?? record.Type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.DiagnosisDesc}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.ChiefComplaint}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.TreatmentPlan}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => startEditRecord(record)}
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRecord(record.RecordID)}
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
        </CardContent>
      </Card>

      {/* Prescription Edit Form */}
      {editingRx && (
        <Card className="mt-6 mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Edit Prescription
            </CardTitle>
            <Button variant="ghost" size="xs" onClick={cancelEditRx}>
              <XMarkIcon className="h-4 w-4" /> Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRxSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Medication</Label>
                  <Input
                    type="text"
                    required
                    value={rxForm.medication}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, medication: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Dosage</Label>
                  <Input
                    type="text"
                    required
                    value={rxForm.dosage}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, dosage: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Input
                    type="text"
                    required
                    value={rxForm.frequency}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, frequency: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Input
                    type="text"
                    required
                    value={rxForm.duration}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, duration: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Refills</Label>
                  <Input
                    type="number"
                    min="0"
                    value={rxForm.refills}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, refills: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    required
                    value={rxForm.startDate}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, startDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date (optional)</Label>
                  <Input
                    type="date"
                    value={rxForm.endDate}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, endDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    value={rxForm.status}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, status: e.target.value })
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                  >
                    {PRESCRIPTION_STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={rxForm.notes}
                    onChange={(e) =>
                      setRxForm({ ...rxForm, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditRx}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={rxSubmitting}>
                  {rxSubmitting ? "Saving..." : "Update Prescription"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
              {prescriptions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No prescriptions found.
                  </TableCell>
                </TableRow>
              ) : (
                prescriptions.map((rx) => (
                  <TableRow
                    key={rx.PrescriptionID}
                    className="cursor-pointer"
                    onClick={() => setSelectedRx(rx)}
                  >
                    <TableCell className="font-medium">
                      {rx.Medication}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rx.Dosage}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rx.Frequency}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(rx.StartDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rx.EndDate ? formatDate(rx.EndDate) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={rxStatusVariant[rx.Status] || ""}
                      >
                        {PRESCRIPTION_STATUS_OPTIONS.find(
                          (s) => s.value === rx.Status,
                        )?.label ?? rx.Status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => startEditRx(rx)}
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteRx(rx.PrescriptionID)}
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
        </CardContent>
      </Card>
      <AppointmentDetail appointment={selectedAppt} onClose={() => setSelectedAppt(null)} />
      <RecordDetail record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      <PrescriptionDetail prescription={selectedRx} onClose={() => setSelectedRx(null)} />
    </>
  );
}
