"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { parseLocalDate } from "@/lib/format";

export interface DetailRecord {
  RecordID: string;
  VisitDate: string;
  Type: string;
  ChiefComplaint: string;
  DiagnosisCode: string;
  DiagnosisDesc: string;
  TreatmentPlan: string;
  HeartRate?: number | null;
  BloodPressure?: string | null;
  Temperature?: number | null;
  Weight?: number | null;
  Height?: number | null;
  FollowUp?: string | null;
  Patient?: { FirstName: string; LastName: string };
  Doctor?: { FirstName: string; LastName: string };
  Appointment?: { Date: string; Type: string; Reason: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  office_visit: "Office Visit",
  lab_result: "Lab Result",
  imaging: "Imaging",
  referral: "Referral",
  procedure_note: "Procedure Note",
};

const APPT_TYPE_LABELS: Record<string, string> = {
  checkup: "Checkup",
  follow_up: "Follow-up",
  consultation: "Consultation",
  procedure: "Procedure",
  emergency: "Emergency",
};

function formatDate(d: string) {
  return parseLocalDate(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
  record: DetailRecord | null;
  onClose: () => void;
  actions?: React.ReactNode;
}

export function RecordDetail({ record, onClose, actions }: Props) {
  const hasVitals =
    record &&
    (record.HeartRate != null ||
      record.BloodPressure != null ||
      record.Temperature != null ||
      record.Weight != null ||
      record.Height != null);

  return (
    <Sheet open={!!record} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Medical Record</SheetTitle>
          {record && (
            <SheetDescription>
              {formatDate(record.VisitDate)}
            </SheetDescription>
          )}
        </SheetHeader>

        {record && (
          <SheetBody>
            <div className="mb-5">
              <Badge variant="secondary">
                {TYPE_LABELS[record.Type] ?? record.Type}
              </Badge>
            </div>

            <dl className="space-y-4">
              {record.Patient && (
                <Field
                  label="Patient"
                  value={`${record.Patient.FirstName} ${record.Patient.LastName}`}
                />
              )}
              {record.Doctor && (
                <Field
                  label="Doctor"
                  value={`Dr. ${record.Doctor.FirstName} ${record.Doctor.LastName}`}
                />
              )}
              <Field label="Chief Complaint" value={record.ChiefComplaint} />
              <Field
                label="Diagnosis"
                value={`${record.DiagnosisCode} — ${record.DiagnosisDesc}`}
              />
              <Field
                label="Treatment Plan"
                value={
                  <span className="whitespace-pre-wrap">{record.TreatmentPlan}</span>
                }
              />
              <Field
                label="Follow-Up Instructions"
                value={
                  record.FollowUp ? (
                    <span className="whitespace-pre-wrap">{record.FollowUp}</span>
                  ) : null
                }
              />

              {hasVitals && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Vitals
                  </dt>
                  <dd className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {record.HeartRate != null && (
                      <span>
                        <span className="text-muted-foreground">HR: </span>
                        {record.HeartRate} bpm
                      </span>
                    )}
                    {record.BloodPressure && (
                      <span>
                        <span className="text-muted-foreground">BP: </span>
                        {record.BloodPressure}
                      </span>
                    )}
                    {record.Temperature != null && (
                      <span>
                        <span className="text-muted-foreground">Temp: </span>
                        {record.Temperature}°F
                      </span>
                    )}
                    {record.Weight != null && (
                      <span>
                        <span className="text-muted-foreground">Weight: </span>
                        {record.Weight} lbs
                      </span>
                    )}
                    {record.Height != null && (
                      <span>
                        <span className="text-muted-foreground">Height: </span>
                        {record.Height} in
                      </span>
                    )}
                  </dd>
                </div>
              )}

              {record.Appointment && (
                <Field
                  label="From Appointment"
                  value={`${formatDate(record.Appointment.Date)} · ${APPT_TYPE_LABELS[record.Appointment.Type] ?? record.Appointment.Type}`}
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
