export interface CalendarAppointment {
  AppointmentID: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  Type: string;
  Status: string;
  Reason: string;
  Place: string;
  Notes?: string | null;
  Patient?: { FirstName: string; LastName: string };
  Doctor?: { FirstName: string; LastName: string };
}

/** Convert a Date object to a YYYY-MM-DD string in local time */
export function toDateKey(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Convert an appointment Date string from the API to a YYYY-MM-DD key in local time */
export function apptDateKey(dateStr: string): string {
  return dateStr.split("T")[0];
}

/** Group appointments by their local date key */
export function groupByDate(
  appointments: CalendarAppointment[],
): Record<string, CalendarAppointment[]> {
  const groups: Record<string, CalendarAppointment[]> = {};
  for (const appt of appointments) {
    const key = apptDateKey(appt.Date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(appt);
  }
  return groups;
}

/**
 * Returns a Set of AppointmentIDs that have at least one time overlap
 * with another appointment on the same day.
 */
export function detectConflicts(
  appointments: CalendarAppointment[],
): Set<string> {
  const conflicting = new Set<string>();
  const byDate = groupByDate(appointments);

  for (const group of Object.values(byDate)) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        const aStart = new Date(a.StartTime).getTime();
        const aEnd = new Date(a.EndTime).getTime();
        const bStart = new Date(b.StartTime).getTime();
        const bEnd = new Date(b.EndTime).getTime();
        if (aStart < bEnd && bStart < aEnd) {
          conflicting.add(a.AppointmentID);
          conflicting.add(b.AppointmentID);
        }
      }
    }
  }

  return conflicting;
}

/**
 * Returns exactly 42 Date objects (6 rows × 7 columns) covering the
 * calendar view for the given year/month, padded with days from the
 * previous and next months.
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDOW = firstDay.getDay(); // 0 = Sunday
  const days: Date[] = [];

  // Fill from end of previous month
  for (let i = startDOW; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Fill start of next month to reach 42 cells
  let nextDay = 1;
  while (days.length < 42) {
    days.push(new Date(year, month + 1, nextDay++));
  }

  return days;
}
