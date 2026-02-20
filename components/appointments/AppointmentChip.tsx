"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExclamationTriangleIcon,
  PencilSquareIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";
import { CalendarAppointment } from "@/lib/appointments";

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

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  scheduled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  no_show: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const chipBg: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  scheduled: "bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200",
  completed: "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200 opacity-60",
  canceled: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200 opacity-50",
  no_show: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-200 opacity-50",
};

function formatTime(timeStr: string) {
  return new Date(timeStr).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface AppointmentChipProps {
  appt: CalendarAppointment;
  isConflict: boolean;
  isUpcoming: boolean;
  role: "doctor" | "patient";
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  onViewDetail?: (appt: CalendarAppointment) => void;
}

export function AppointmentChip({
  appt,
  isConflict,
  isUpcoming,
  role,
  onEdit,
  onCancel,
  onViewDetail,
}: AppointmentChipProps) {
  const bg = chipBg[appt.Status] ?? "bg-muted text-muted-foreground";
  const typeLabel = TYPE_LABELS[appt.Type] ?? appt.Type;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={[
            "w-full text-left rounded px-1.5 py-0.5 text-xs leading-snug truncate transition-opacity hover:opacity-80 cursor-pointer",
            bg,
            isConflict ? "ring-2 ring-red-500 ring-inset" : "",
            isUpcoming && !isConflict ? "ring-2 ring-primary ring-inset" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {isConflict && (
            <ExclamationTriangleIcon className="inline h-3 w-3 mr-0.5 shrink-0 align-[-1px] text-red-500" />
          )}
          {formatTime(appt.StartTime)} {typeLabel}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72" align="start" side="bottom">
        <div className="space-y-3">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-sm">{typeLabel}</p>
              <p className="text-xs text-muted-foreground">{formatDate(appt.Date)}</p>
            </div>
            <Badge
              variant="secondary"
              className={`text-xs shrink-0 ${statusBadge[appt.Status] ?? ""}`}
            >
              {STATUS_LABELS[appt.Status] ?? appt.Status}
            </Badge>
          </div>

          {/* Details */}
          <div className="text-xs space-y-1">
            <div>
              <span className="font-medium">Time:</span>{" "}
              <span className="text-muted-foreground">
                {formatTime(appt.StartTime)} – {formatTime(appt.EndTime)}
              </span>
            </div>
            <div>
              <span className="font-medium">Reason:</span>{" "}
              <span className="text-muted-foreground">{appt.Reason}</span>
            </div>
            <div>
              <span className="font-medium">Place:</span>{" "}
              <span className="text-muted-foreground">{appt.Place}</span>
            </div>
            {appt.Patient && (
              <div>
                <span className="font-medium">Patient:</span>{" "}
                <span className="text-muted-foreground">
                  {appt.Patient.FirstName} {appt.Patient.LastName}
                </span>
              </div>
            )}
            {appt.Doctor && (
              <div>
                <span className="font-medium">Doctor:</span>{" "}
                <span className="text-muted-foreground">
                  Dr. {appt.Doctor.FirstName} {appt.Doctor.LastName}
                </span>
              </div>
            )}
          </div>

          {/* Conflict warning */}
          {isConflict && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
              <ExclamationTriangleIcon className="h-3.5 w-3.5 shrink-0" />
              Time conflict with another appointment
            </p>
          )}

          {/* Actions */}
          {onViewDetail && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onViewDetail(appt)}
            >
              <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
              View Details
            </Button>
          )}

          {role === "doctor" && onEdit && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => onEdit(appt.AppointmentID)}
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
              Edit Appointment
            </Button>
          )}

          {role === "patient" &&
            onCancel &&
            (appt.Status === "scheduled" || appt.Status === "pending") && (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                onClick={() => onCancel(appt.AppointmentID)}
              >
                Cancel Appointment
              </Button>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
