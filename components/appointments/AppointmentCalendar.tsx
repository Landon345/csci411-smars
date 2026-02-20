"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  CalendarAppointment,
  detectConflicts,
  getCalendarDays,
  groupByDate,
  toDateKey,
} from "@/lib/appointments";
import { AppointmentChip } from "./AppointmentChip";
import { ConflictBanner } from "./ConflictBanner";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AppointmentCalendarProps {
  appointments: CalendarAppointment[];
  role: "doctor" | "patient";
  onEditAppt?: (id: string) => void;
  onCancelAppt?: (id: string) => void;
}

export function AppointmentCalendar({
  appointments,
  role,
  onEditAppt,
  onCancelAppt,
}: AppointmentCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const calendarDays = useMemo(
    () => getCalendarDays(year, month),
    [year, month],
  );

  const grouped = useMemo(() => groupByDate(appointments), [appointments]);

  const conflictIds = useMemo(
    () =>
      role === "doctor" ? detectConflicts(appointments) : new Set<string>(),
    [appointments, role],
  );

  // Count conflicting appointments visible in the current month
  const visibleConflictCount = useMemo(() => {
    if (role !== "doctor") return 0;
    return appointments.filter((a) => {
      const d = new Date(a.Date);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        conflictIds.has(a.AppointmentID)
      );
    }).length;
  }, [appointments, conflictIds, year, month, role]);

  const todayKey = toDateKey(today);
  const sevenDaysFromNow = toDateKey(
    new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
  );

  const monthLabel = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-40 text-center">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={goToToday}
        >
          Today
        </Button>
      </div>

      <div className="p-4">
        {/* Conflict banner — doctor only */}
        {role === "doctor" && (
          <ConflictBanner count={visibleConflictCount} />
        )}

        {/* Day-of-week labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-md overflow-hidden">
          {calendarDays.map((day, idx) => {
            const key = toDateKey(day);
            const isCurrentMonth = day.getMonth() === month;
            const isToday = key === todayKey;
            const dayAppts = grouped[key] ?? [];

            // Patient: highlight upcoming appts within the next 7 days
            const isUpcomingWindow =
              role === "patient" &&
              key >= todayKey &&
              key <= sevenDaysFromNow;

            return (
              <div
                key={idx}
                className={[
                  "bg-card min-h-[90px] p-1.5",
                  !isCurrentMonth ? "opacity-35" : "",
                ].join(" ")}
              >
                {/* Date number */}
                <div
                  className={[
                    "text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full mx-auto mb-1",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  {day.getDate()}
                </div>

                {/* Appointment chips — max 2, then overflow count */}
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 2).map((appt) => (
                    <AppointmentChip
                      key={appt.AppointmentID}
                      appt={appt}
                      isConflict={conflictIds.has(appt.AppointmentID)}
                      isUpcoming={
                        isUpcomingWindow &&
                        (appt.Status === "scheduled" ||
                          appt.Status === "pending")
                      }
                      role={role}
                      onEdit={onEditAppt}
                      onCancel={onCancelAppt}
                    />
                  ))}
                  {dayAppts.length > 2 && (
                    <p className="text-xs text-muted-foreground pl-1">
                      +{dayAppts.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
