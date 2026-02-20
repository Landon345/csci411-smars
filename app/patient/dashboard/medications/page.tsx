"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PrescriptionDetail } from "@/components/details/PrescriptionDetail";

interface Prescription {
  PrescriptionID: string;
  Doctor: { FirstName: string; LastName: string };
  Medication: string;
  Dosage: string;
  Frequency: string;
  Duration: string;
  Refills: number;
  StartDate: string;
  EndDate: string | null;
  Status: string;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "discontinued", label: "Discontinued" },
];

const statusVariant: Record<string, string> = {
  active:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  discontinued:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

export default function PatientMedicationsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchMedications();
  }, []);

  async function fetchMedications() {
    try {
      const res = await fetch("/api/patient/medications");
      if (!res.ok) return;
      const data = await res.json();
      setPrescriptions(data.prescriptions);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <header className="mb-4">
          <h2 className="text-xl font-medium tracking-tight">My Medications</h2>
          <p className="text-sm text-muted-foreground">View your prescriptions and medications.</p>
        </header>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Refills</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </>
    );
  }

  return (
    <>
      <header className="mb-4">
        <h2 className="text-xl font-medium tracking-tight">My Medications</h2>
        <p className="text-sm text-muted-foreground">
          View your prescriptions and medications.
        </p>
      </header>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medication</TableHead>
              <TableHead>Dosage</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Refills</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground py-8"
                >
                  No medications found.
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((rx) => (
                <TableRow
                  key={rx.PrescriptionID}
                  className="cursor-pointer"
                  onClick={() => setSelected(rx)}
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
                    {rx.Duration}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rx.Refills}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(rx.StartDate)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rx.EndDate ? formatDate(rx.EndDate) : "-"}
                  </TableCell>
                  <TableCell className="font-medium">
                    Dr. {rx.Doctor.FirstName} {rx.Doctor.LastName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusVariant[rx.Status] || ""}
                    >
                      {STATUS_OPTIONS.find((s) => s.value === rx.Status)
                        ?.label ?? rx.Status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <PrescriptionDetail prescription={selected} onClose={() => setSelected(null)} />
    </>
  );
}
