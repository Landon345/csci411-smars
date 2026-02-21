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

export interface DetailPrescription {
  PrescriptionID: string;
  Medication: string;
  Dosage: string;
  Frequency: string;
  Duration: string;
  Refills: number;
  StartDate: string;
  EndDate?: string | null;
  Status: string;
  Notes?: string | null;
  Patient?: { FirstName: string; LastName: string };
  Doctor?: { FirstName: string; LastName: string };
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  discontinued: "Discontinued",
};

const statusVariant: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  discontinued: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
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
  prescription: DetailPrescription | null;
  onClose: () => void;
  actions?: React.ReactNode;
}

export function PrescriptionDetail({ prescription, onClose, actions }: Props) {
  return (
    <Sheet open={!!prescription} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{prescription?.Medication ?? "Prescription"}</SheetTitle>
          {prescription && (
            <SheetDescription>
              {prescription.Dosage} · {prescription.Frequency}
            </SheetDescription>
          )}
        </SheetHeader>

        {prescription && (
          <SheetBody>
            <div className="mb-5">
              <Badge
                variant="secondary"
                className={statusVariant[prescription.Status] ?? ""}
              >
                {STATUS_LABELS[prescription.Status] ?? prescription.Status}
              </Badge>
            </div>

            <dl className="space-y-4">
              {prescription.Patient && (
                <Field
                  label="Patient"
                  value={`${prescription.Patient.FirstName} ${prescription.Patient.LastName}`}
                />
              )}
              {prescription.Doctor && (
                <Field
                  label="Prescribing Doctor"
                  value={`Dr. ${prescription.Doctor.FirstName} ${prescription.Doctor.LastName}`}
                />
              )}
              <Field label="Dosage" value={prescription.Dosage} />
              <Field label="Frequency" value={prescription.Frequency} />
              <Field label="Duration" value={prescription.Duration} />
              <Field label="Refills Remaining" value={String(prescription.Refills)} />
              <Field label="Start Date" value={formatDate(prescription.StartDate)} />
              <Field
                label="End Date"
                value={prescription.EndDate ? formatDate(prescription.EndDate) : "Ongoing"}
              />
              <Field label="Notes" value={prescription.Notes} />
            </dl>

            {actions && <div className="mt-6 flex flex-col gap-2">{actions}</div>}
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}
