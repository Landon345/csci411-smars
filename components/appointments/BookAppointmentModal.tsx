"use client";

import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/lib/avatarColor";

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
  photoUrl?: string | null;
}

interface BookAppointmentModalProps {
  doctor: Doctor | null;
  onClose: () => void;
  onBooked: () => void;
}

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

const DEGREE_LABELS: Record<string, string> = {
  MD: "Doctor of Medicine",
  DO: "Doctor of Osteopathic Medicine",
  NP: "Nurse Practitioner",
  PA: "Physician Associate",
};

function degreeBadgeClass(degree: string) {
  if (degree === "MD" || degree === "DO") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
}

function isSlotPast(slot: string, selectedDate: Date): boolean {
  const now = new Date();
  if (selectedDate.toDateString() !== now.toDateString()) return false;
  const [h, m] = slot.split(":").map(Number);
  return h * 60 + m <= now.getHours() * 60 + now.getMinutes();
}

function formatSlot(slot: string): string {
  const [hourStr, minuteStr] = slot.split(":");
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

export function BookAppointmentModal({ doctor, onClose, onBooked }: BookAppointmentModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [type, setType] = useState("checkup");
  const [reason, setReason] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!doctor) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const dateStr = date.toISOString().split("T")[0];
    fetch(`/api/patient/doctors/${doctor.UserID}/availability?date=${dateStr}`)
      .then((r) => r.json())
      .then(({ booked }) => setBookedSlots(booked ?? []))
      .finally(() => setLoadingSlots(false));
  }, [doctor, date]);

  async function handleSubmit() {
    if (!doctor || !selectedSlot || !reason) return;
    setSubmitting(true);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor.UserID,
          date: dateStr,
          startTime: selectedSlot,
          reason,
          type,
        }),
      });
      if (res.ok) {
        onBooked();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const p = doctor?.DoctorProfile ?? null;
  const avatarStyle = doctor ? getAvatarColor(doctor.UserID) : {};
  const initials = doctor ? getInitials(doctor.FirstName, doctor.LastName) : "";

  return (
    <TooltipProvider>
    <Dialog open={!!doctor} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage
                src={doctor?.photoUrl ?? undefined}
                alt={doctor ? `Dr. ${doctor.FirstName} ${doctor.LastName}` : undefined}
              />
              <AvatarFallback style={avatarStyle} className="text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>
                Dr. {doctor?.FirstName} {doctor?.LastName}
              </DialogTitle>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {p?.Degree && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className={degreeBadgeClass(p.Degree)}>
                    {p.Degree}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{DEGREE_LABELS[p.Degree] ?? p.Degree}</TooltipContent>
              </Tooltip>
            )}
            {p?.BoardCertified && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                Board Certified
              </Badge>
            )}
            {p?.Telehealth && (
              <Badge
                variant="secondary"
                className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              >
                Telehealth
              </Badge>
            )}
          </div>
          {p?.Specialty && (
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-medium text-foreground">Specialty:</span> {p.Specialty}
            </p>
          )}
          {p?.SubSpecialties && p.SubSpecialties.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Focus:</span>{" "}
              {p.SubSpecialties.join(" · ")}
            </p>
          )}
          {p?.Bio && (
            <p className="text-sm text-muted-foreground mt-1">{p.Bio}</p>
          )}
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-5">
          <hr />

          {/* Date picker */}
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
                    if (d) {
                      setDate(d);
                      setCalendarOpen(false);
                    }
                  }}
                  disabled={{ before: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time slots */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Available Times</p>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading slots…</p>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Morning</p>
                  <div className="flex flex-wrap gap-2">
                    {MORNING.map((slot) => {
                      const disabled = bookedSlots.includes(slot) || isSlotPast(slot, date);
                      const selected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          disabled={disabled}
                          onClick={() => setSelectedSlot(slot)}
                          className={[
                            "rounded-full border px-3 py-1 text-sm transition-colors",
                            disabled
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
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Afternoon</p>
                  <div className="flex flex-wrap gap-2">
                    {AFTERNOON.map((slot) => {
                      const disabled = bookedSlots.includes(slot) || isSlotPast(slot, date);
                      const selected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          disabled={disabled}
                          onClick={() => setSelectedSlot(slot)}
                          className={[
                            "rounded-full border px-3 py-1 text-sm transition-colors",
                            disabled
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
              </div>
            )}
          </div>

          {/* Appointment type */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Appointment Type</p>
            <div className="flex flex-wrap gap-2">
              {APPOINTMENT_TYPES.map((t) => (
                <button
                  key={t.value}
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

          {/* Reason */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Reason for Visit</p>
            <Textarea
              placeholder="Describe your reason for visiting…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSlot || !reason || submitting}
          >
            {submitting ? "Booking…" : "Book Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
}

// Also export ALL_SLOTS for potential reuse
export { ALL_SLOTS };
