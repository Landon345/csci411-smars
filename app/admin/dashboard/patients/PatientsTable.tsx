"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Doctor {
  UserID: string;
  FirstName: string;
  LastName: string;
}

interface Patient {
  UserID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string | null;
  CreatedAt: string;
  PatientProfile: {
    PrimaryCarePhysicianID: string | null;
    PrimaryCarePhysician: { FirstName: string; LastName: string } | null;
  } | null;
}

function AssignPCPDialog({
  patient,
  doctors,
  onClose,
  onSave,
}: {
  patient: Patient;
  doctors: Doctor[];
  onClose: () => void;
  onSave: (patientId: string, doctorId: string | null, doctorName: string | null) => void;
}) {
  const currentId = patient.PatientProfile?.PrimaryCarePhysicianID ?? null;
  const [selected, setSelected] = useState<string>(currentId ?? "none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const doctorId = selected === "none" ? null : selected;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/patients/${patient.UserID}/pcp`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      const doctor = doctors.find((d) => d.UserID === doctorId);
      const doctorName = doctor ? `${doctor.FirstName} ${doctor.LastName}` : null;
      onSave(patient.UserID, doctorId, doctorName);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = selected !== (currentId ?? "none");

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          Assign Primary Care Physician
        </DialogTitle>
        <p className="text-sm text-muted-foreground pt-1">
          Patient: <span className="font-medium text-foreground">{patient.FirstName} {patient.LastName}</span>
        </p>
      </DialogHeader>

      <div className="py-2 px-6">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a doctor..." />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="none">
              <span className="text-muted-foreground">None</span>
            </SelectItem>
            {doctors.map((d) => (
              <SelectItem key={d.UserID} value={d.UserID}>
                Dr. {d.FirstName} {d.LastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !isDirty}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function PatientsTable({
  patients: initialPatients,
  doctors,
}: {
  patients: Patient[];
  doctors: Doctor[];
}) {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [assignTarget, setAssignTarget] = useState<Patient | null>(null);

  function handleSave(
    patientId: string,
    doctorId: string | null,
    doctorName: string | null,
  ) {
    setPatients((prev) =>
      prev.map((p) =>
        p.UserID !== patientId
          ? p
          : {
              ...p,
              PatientProfile: {
                PrimaryCarePhysicianID: doctorId,
                PrimaryCarePhysician: doctorName
                  ? {
                      FirstName: doctorName.split(" ")[0],
                      LastName: doctorName.split(" ").slice(1).join(" "),
                    }
                  : null,
              },
            },
      ),
    );
  }

  const columns = useMemo<ColumnDef<Patient, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.FirstName} ${row.LastName}`,
        meta: { label: "Name" },
        header: ({ column }) => <SortableHeader column={column} label="Name" />,
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.FirstName} {row.original.LastName}
          </span>
        ),
      },
      {
        id: "email",
        accessorKey: "Email",
        meta: { label: "Email" },
        header: ({ column }) => <SortableHeader column={column} label="Email" />,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "phone",
        accessorKey: "Phone",
        meta: { label: "Phone" },
        header: ({ column }) => <SortableHeader column={column} label="Phone" />,
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">
            {(getValue() as string | null) || "—"}
          </span>
        ),
      },
      {
        id: "pcp",
        accessorFn: (row) => {
          const doc = row.PatientProfile?.PrimaryCarePhysician;
          return doc ? `${doc.FirstName} ${doc.LastName}` : "";
        },
        meta: { label: "Primary Care" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Primary Care" />
        ),
        cell: ({ row }) => {
          const doc = row.original.PatientProfile?.PrimaryCarePhysician;
          return doc ? (
            <span>Dr. {doc.FirstName} {doc.LastName}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.CreatedAt,
        sortingFn: "datetime",
        enableGlobalFilter: false,
        meta: { label: "Created" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Created" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.CreatedAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableGlobalFilter: false,
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAssignTarget(row.original)}
          >
            Assign PCP
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DataTable
        data={patients}
        columns={columns}
        searchPlaceholder="Search patients..."
      />

      <Dialog open={!!assignTarget} onOpenChange={(open) => { if (!open) setAssignTarget(null); }}>
        {assignTarget && (
          <AssignPCPDialog
            patient={assignTarget}
            doctors={doctors}
            onClose={() => setAssignTarget(null)}
            onSave={handleSave}
          />
        )}
      </Dialog>
    </>
  );
}
