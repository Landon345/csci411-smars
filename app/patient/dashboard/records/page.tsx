"use client";

import { useEffect, useState } from "react";
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

interface MedicalRecord {
  RecordID: string;
  Doctor: { FirstName: string; LastName: string };
  Appointment: { Date: string; Type: string; Reason: string } | null;
  VisitDate: string;
  ChiefComplaint: string;
  DiagnosisCode: string;
  DiagnosisDesc: string;
  TreatmentPlan: string;
  Type: string;
}

const TYPE_OPTIONS = [
  { value: "office_visit", label: "Office Visit" },
  { value: "lab_result", label: "Lab Result" },
  { value: "imaging", label: "Imaging" },
  { value: "referral", label: "Referral" },
  { value: "procedure_note", label: "Procedure Note" },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString();
}

function typeLabel(type: string) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const res = await fetch("/api/patient/records");
      if (!res.ok) return;
      const data = await res.json();
      setRecords(data.records);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <header className="mb-4">
          <h2 className="text-xl font-medium tracking-tight">My Medical Records</h2>
          <p className="text-sm text-muted-foreground">View your medical history.</p>
        </header>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead>Chief Complaint</TableHead>
                <TableHead>Treatment Plan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
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
        <h2 className="text-xl font-medium tracking-tight">
          My Medical Records
        </h2>
        <p className="text-sm text-muted-foreground">
          View your medical history.
        </p>
      </header>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Appointment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Diagnosis</TableHead>
              <TableHead>Chief Complaint</TableHead>
              <TableHead>Treatment Plan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground py-8"
                >
                  No records found.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.RecordID}>
                  <TableCell>{formatDate(record.VisitDate)}</TableCell>
                  <TableCell className="font-medium">
                    Dr. {record.Doctor.FirstName} {record.Doctor.LastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.Appointment ? (
                      <span>
                        {formatDate(record.Appointment.Date)}
                        <span className="block text-xs capitalize">{record.Appointment.Type.replace("_", " ")}</span>
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeLabel(record.Type)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.DiagnosisCode} - {record.DiagnosisDesc}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.ChiefComplaint}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.TreatmentPlan}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
