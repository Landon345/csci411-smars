"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
  SheetCloseButton,
} from "@/components/ui/sheet";
import { parseLocalDate } from "@/lib/format";

export interface DetailAppointment {
  AppointmentID: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  Type: string;
  Status: string;
  Reason: string;
  Place: string;
  Notes?: string | null;
  CanceledBy?: string | null;
  VisitSummary?: string | null;
  Patient?: { FirstName: string; LastName: string };
  Doctor?: { FirstName: string; LastName: string };
}

const TYPE_LABELS: Record<string, string> = {
  checkup: "Checkup",
  follow_up: "Follow-up",
  consultation: "Consultation",
  procedure: "Procedure",
  emergency: "Emergency",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  scheduled: "Scheduled",
  completed: "Completed",
  canceled: "Canceled",
  no_show: "No Show",
};

const statusVariant: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  scheduled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  no_show: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

function formatDate(d: string) {
  return parseLocalDate(d).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(t: string) {
  return new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

interface Props {
  appointment: DetailAppointment | null;
  onClose: () => void;
  actions?: React.ReactNode;
}

export function AppointmentDetail({ appointment, onClose, actions }: Props) {
  return (
    <Sheet open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <div>
            <SheetTitle>Appointment Details</SheetTitle>
            {appointment && (
              <SheetDescription className="mt-1">
                {formatDate(appointment.Date)}
              </SheetDescription>
            )}
          </div>
          <SheetCloseButton onClick={onClose} />
        </SheetHeader>

        {appointment && (
          <SheetBody>
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <Badge
                variant="secondary"
                className={statusVariant[appointment.Status] ?? ""}
              >
                {STATUS_LABELS[appointment.Status] ?? appointment.Status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {TYPE_LABELS[appointment.Type] ?? appointment.Type}
              </span>
            </div>

            <dl className="space-y-4">
              <Field
                label="Time"
                value={`${formatTime(appointment.StartTime)} – ${formatTime(appointment.EndTime)}`}
              />
              <Field label="Place" value={appointment.Place} />
              <Field label="Reason" value={appointment.Reason} />
              {appointment.Patient && (
                <Field
                  label="Patient"
                  value={`${appointment.Patient.FirstName} ${appointment.Patient.LastName}`}
                />
              )}
              {appointment.Doctor && (
                <Field
                  label="Doctor"
                  value={`Dr. ${appointment.Doctor.FirstName} ${appointment.Doctor.LastName}`}
                />
              )}
              <Field label="Notes" value={appointment.Notes} />
              {appointment.Status === "canceled" && (
                <Field label="Canceled By" value={appointment.CanceledBy} />
              )}
              {appointment.VisitSummary && (
                <Field
                  label="Visit Summary (SOAP)"
                  value={
                    <span className="whitespace-pre-wrap">{appointment.VisitSummary}</span>
                  }
                />
              )}
            </dl>

            {actions && <div className="mt-6 flex flex-col gap-2">{actions}</div>}
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}
