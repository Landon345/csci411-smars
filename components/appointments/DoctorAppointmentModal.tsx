"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MORNING = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const AFTERNOON = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
const ALL_SLOTS = [...MORNING, ...AFTERNOON];

const APPOINTMENT_TYPES = [
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

export interface ModalAppointment {
  AppointmentID: string;
  PatientID: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  Place: string;
  Reason: string;
  Type: string;
  Status: string;
  Notes: string | null;
  VisitSummary: string | null;
}

export interface ModalPatient {
  UserID: string;
  FirstName: string;
  LastName: string;
}

interface DoctorAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  patients: ModalPatient[];
  editing: ModalAppointment | null;
  existingAppointments: ModalAppointment[];
}

function formatSlot(slot: string): string {
  const [hourStr, minuteStr] = slot.split(":");
  const hour = parseInt(hourStr, 10);
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function parseTimeMinutes(timeStr: string): number {
  const d = new Date(timeStr);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function addMinutes(slot: string, mins: number): string {
  const [h, m] = slot.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function DoctorAppointmentModal({
  open,
  onClose,
  onSaved,
  patients,
  editing,
  existingAppointments,
}: DoctorAppointmentModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [type, setType] = useState("checkup");
  const [status, setStatus] = useState("scheduled");
  const [patientId, setPatientId] = useState("");
  const [place, setPlace] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [visitSummary, setVisitSummary] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const dateKey = editing.Date.split("T")[0];
      setDate(new Date(dateKey + "T12:00:00"));

      const mins = parseTimeMinutes(editing.StartTime);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      const slotStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      setSelectedSlot(ALL_SLOTS.includes(slotStr) ? slotStr : null);

      setType(editing.Type);
      setStatus(editing.Status);
      setPatientId(editing.PatientID);
      setPlace(editing.Place);
      setReason(editing.Reason);
      setNotes(editing.Notes ?? "");
      setVisitSummary(editing.VisitSummary ?? "");
    } else {
      setDate(new Date());
      setSelectedSlot(null);
      setType("checkup");
      setStatus("scheduled");
      setPatientId("");
      setPlace("");
      setReason("");
      setNotes("");
      setVisitSummary("");
    }
    setCalendarOpen(false);
  }, [open, editing]);

  const bookedSlots = useMemo(() => {
    const dateKey = localDateStr(date);
    const dayAppts = existingAppointments.filter(
      (a) =>
        a.Date.startsWith(dateKey) &&
        a.AppointmentID !== editing?.AppointmentID &&
        !["canceled", "no_show"].includes(a.Status),
    );
    return ALL_SLOTS.filter((slot) => {
      const [h, m] = slot.split(":").map(Number);
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + 30;
      return dayAppts.some((appt) => {
        const apptStart = parseTimeMinutes(appt.StartTime);
        const apptEnd = parseTimeMinutes(appt.EndTime);
        return slotStart < apptEnd && slotEnd > apptStart;
      });
    });
  }, [date, existingAppointments, editing]);

  async function handleSubmit() {
    if (!selectedSlot || !patientId || !reason.trim() || !place.trim()) return;
    setSubmitting(true);
    try {
      const body = {
        patientId,
        date: localDateStr(date),
        startTime: selectedSlot,
        endTime: addMinutes(selectedSlot, 30),
        place,
        reason,
        type,
        status,
        notes,
        visitSummary,
      };
      const res = editing
        ? await fetch(`/api/doctor/appointments/${editing.AppointmentID}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/doctor/appointments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function SlotGroup({ slots, label }: { slots: string[]; label: string }) {
    return (
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const booked = bookedSlots.includes(slot);
            const selected = selectedSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                disabled={booked}
                onClick={() => setSelectedSlot(slot)}
                className={[
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  booked
                    ? "opacity-40 cursor-not-allowed"
                    : selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent",
                ].join(" ")}
              >
                {formatSlot(slot)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Appointment" : "New Appointment"}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Patient */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Patient</p>
            <select
              required
              disabled={!!editing}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none disabled:opacity-50"
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.UserID} value={p.UserID}>
                  {p.FirstName} {p.LastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Date</p>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 size-4" />
                  {format(date, "MMMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) { setDate(d); setCalendarOpen(false); }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time slots */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Time Slot</p>
            <div className="space-y-3">
              <SlotGroup slots={MORNING} label="Morning" />
              <SlotGroup slots={AFTERNOON} label="Afternoon" />
            </div>
          </div>

          {/* Appointment type */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Appointment Type</p>
            <div className="flex flex-wrap gap-2">
              {APPOINTMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    type === t.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent",
                  ].join(" ")}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status (edit only) */}
          {editing && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={[
                      "rounded-full border px-3 py-1 text-sm transition-colors",
                      status === s.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent",
                    ].join(" ")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Place */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Place</p>
            <Input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="e.g. Room 204"
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Reason for Visit</p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Reason for visit"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">
              Notes{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Additional notes…"
            />
          </div>

          {/* Visit summary (edit + completed) */}
          {editing && status === "completed" && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Visit Summary (SOAP Note)</p>
              <Textarea
                value={visitSummary}
                onChange={(e) => setVisitSummary(e.target.value)}
                rows={4}
                placeholder={"S: Subjective\nO: Objective\nA: Assessment\nP: Plan"}
              />
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSlot || !patientId || !reason.trim() || !place.trim() || submitting}
          >
            {submitting ? "Saving…" : editing ? "Update Appointment" : "Create Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
