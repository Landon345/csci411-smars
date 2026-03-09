"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";

const BLOOD_TYPE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "A_positive", label: "A+" },
  { value: "A_negative", label: "A-" },
  { value: "B_positive", label: "B+" },
  { value: "B_negative", label: "B-" },
  { value: "AB_positive", label: "AB+" },
  { value: "AB_negative", label: "AB-" },
  { value: "O_positive", label: "O+" },
  { value: "O_negative", label: "O-" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "severe", label: "Severe" },
];

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  severe: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface Doctor {
  UserID: string;
  FirstName: string;
  LastName: string;
}

interface PatientProfile {
  BloodType: string | null;
  InsuranceProvider: string | null;
  InsurancePolicyNumber: string | null;
  EmergencyContactName: string | null;
  EmergencyContactPhone: string | null;
  EmergencyContactRelationship: string | null;
  PrimaryCarePhysician: { FirstName: string; LastName: string } | null;
  PrimaryCarePhysicianID?: string | null;
}

interface Allergy {
  AllergyID: string;
  Name: string;
  Severity: string;
  Reaction: string | null;
}

interface ChronicCondition {
  ConditionID: string;
  Name: string;
}

interface Props {
  patientId: string;
  open: boolean;
  onClose: () => void;
  onSaved: (updated: {
    profile: PatientProfile | null;
    allergies: Allergy[];
    conditions: ChronicCondition[];
  }) => void;
  initialProfile: PatientProfile | null | undefined;
  initialAllergies: Allergy[];
  initialConditions: ChronicCondition[];
}

export default function PatientHealthProfileModal({
  patientId,
  open,
  onClose,
  onSaved,
  initialProfile,
  initialAllergies,
  initialConditions,
}: Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [profileForm, setProfileForm] = useState({
    BloodType: initialProfile?.BloodType ?? "",
    InsuranceProvider: initialProfile?.InsuranceProvider ?? "",
    InsurancePolicyNumber: initialProfile?.InsurancePolicyNumber ?? "",
    EmergencyContactName: initialProfile?.EmergencyContactName ?? "",
    EmergencyContactPhone: initialProfile?.EmergencyContactPhone ?? "",
    EmergencyContactRelationship: initialProfile?.EmergencyContactRelationship ?? "",
    PrimaryCarePhysicianID: initialProfile?.PrimaryCarePhysicianID ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [allergies, setAllergies] = useState<Allergy[]>(initialAllergies);
  const [allergyForm, setAllergyForm] = useState({ Name: "", Severity: "low", Reaction: "" });
  const [allergyAdding, setAllergyAdding] = useState(false);

  const [conditions, setConditions] = useState<ChronicCondition[]>(initialConditions);
  const [conditionName, setConditionName] = useState("");
  const [conditionAdding, setConditionAdding] = useState(false);

  // Re-sync state when modal opens with fresh data
  useEffect(() => {
    if (open) {
      setProfileForm({
        BloodType: initialProfile?.BloodType ?? "",
        InsuranceProvider: initialProfile?.InsuranceProvider ?? "",
        InsurancePolicyNumber: initialProfile?.InsurancePolicyNumber ?? "",
        EmergencyContactName: initialProfile?.EmergencyContactName ?? "",
        EmergencyContactPhone: initialProfile?.EmergencyContactPhone ?? "",
        EmergencyContactRelationship: initialProfile?.EmergencyContactRelationship ?? "",
        PrimaryCarePhysicianID: initialProfile?.PrimaryCarePhysicianID ?? "",
      });
      setAllergies(initialAllergies);
      setConditions(initialConditions);
      setProfileMsg(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors ?? []));
  }, []);

  async function handleSaveProfile() {
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          BloodType: profileForm.BloodType || null,
          InsuranceProvider: profileForm.InsuranceProvider || null,
          InsurancePolicyNumber: profileForm.InsurancePolicyNumber || null,
          EmergencyContactName: profileForm.EmergencyContactName || null,
          EmergencyContactPhone: profileForm.EmergencyContactPhone || null,
          EmergencyContactRelationship: profileForm.EmergencyContactRelationship || null,
          PrimaryCarePhysicianID: profileForm.PrimaryCarePhysicianID || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setProfileMsg({ type: "error", text: data.error ?? "Failed to save." });
        return;
      }
      const data = await res.json();
      setProfileMsg({ type: "success", text: "Profile saved." });
      onSaved({ profile: data.profile, allergies, conditions });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleAddAllergy() {
    if (!allergyForm.Name.trim()) return;
    setAllergyAdding(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/allergies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: allergyForm.Name,
          Severity: allergyForm.Severity,
          Reaction: allergyForm.Reaction || null,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const updated = [...allergies, data.allergy];
      setAllergies(updated);
      setAllergyForm({ Name: "", Severity: "low", Reaction: "" });
      onSaved({ profile: buildCurrentProfile(), allergies: updated, conditions });
    } finally {
      setAllergyAdding(false);
    }
  }

  async function handleDeleteAllergy(allergyId: string) {
    const res = await fetch(
      `/api/doctor/patients/${patientId}/allergies/${allergyId}`,
      { method: "DELETE" },
    );
    if (!res.ok) return;
    const updated = allergies.filter((a) => a.AllergyID !== allergyId);
    setAllergies(updated);
    onSaved({ profile: buildCurrentProfile(), allergies: updated, conditions });
  }

  async function handleAddCondition() {
    if (!conditionName.trim()) return;
    setConditionAdding(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Name: conditionName }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const updated = [...conditions, data.condition];
      setConditions(updated);
      setConditionName("");
      onSaved({ profile: buildCurrentProfile(), allergies, conditions: updated });
    } finally {
      setConditionAdding(false);
    }
  }

  async function handleDeleteCondition(conditionId: string) {
    const res = await fetch(
      `/api/doctor/patients/${patientId}/conditions/${conditionId}`,
      { method: "DELETE" },
    );
    if (!res.ok) return;
    const updated = conditions.filter((c) => c.ConditionID !== conditionId);
    setConditions(updated);
    onSaved({ profile: buildCurrentProfile(), allergies, conditions: updated });
  }

  function buildCurrentProfile(): PatientProfile | null {
    const pcp = doctors.find((d) => d.UserID === profileForm.PrimaryCarePhysicianID);
    return {
      BloodType: profileForm.BloodType || null,
      InsuranceProvider: profileForm.InsuranceProvider || null,
      InsurancePolicyNumber: profileForm.InsurancePolicyNumber || null,
      EmergencyContactName: profileForm.EmergencyContactName || null,
      EmergencyContactPhone: profileForm.EmergencyContactPhone || null,
      EmergencyContactRelationship: profileForm.EmergencyContactRelationship || null,
      PrimaryCarePhysicianID: profileForm.PrimaryCarePhysicianID || null,
      PrimaryCarePhysician: pcp
        ? { FirstName: pcp.FirstName, LastName: pcp.LastName }
        : null,
    };
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Health Profile</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-8">
          {/* Section 1 — Medical Profile */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Medical Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Blood Type</Label>
                <select
                  value={profileForm.BloodType}
                  onChange={(e) => setProfileForm({ ...profileForm, BloodType: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                >
                  {BLOOD_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Primary Care Physician</Label>
                <select
                  value={profileForm.PrimaryCarePhysicianID}
                  onChange={(e) => setProfileForm({ ...profileForm, PrimaryCarePhysicianID: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                >
                  <option value="">Not specified</option>
                  {doctors.map((d) => (
                    <option key={d.UserID} value={d.UserID}>
                      Dr. {d.FirstName} {d.LastName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Insurance Provider</Label>
                <Input
                  value={profileForm.InsuranceProvider}
                  onChange={(e) => setProfileForm({ ...profileForm, InsuranceProvider: e.target.value })}
                  placeholder="e.g. Blue Cross Blue Shield"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Policy Number</Label>
                <Input
                  value={profileForm.InsurancePolicyNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, InsurancePolicyNumber: e.target.value })}
                  placeholder="e.g. XYZ123456789"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Emergency Contact Name</Label>
                <Input
                  value={profileForm.EmergencyContactName}
                  onChange={(e) => setProfileForm({ ...profileForm, EmergencyContactName: e.target.value })}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Emergency Contact Phone</Label>
                <Input
                  value={profileForm.EmergencyContactPhone}
                  onChange={(e) => setProfileForm({ ...profileForm, EmergencyContactPhone: e.target.value })}
                  placeholder="e.g. +1 (555) 000-0000"
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Emergency Contact Relationship</Label>
                <Input
                  value={profileForm.EmergencyContactRelationship}
                  onChange={(e) => setProfileForm({ ...profileForm, EmergencyContactRelationship: e.target.value })}
                  placeholder="e.g. Spouse, Parent, Sibling"
                />
              </div>
            </div>

            {profileMsg && (
              <p className={`text-sm mt-2 ${profileMsg.type === "success" ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                {profileMsg.text}
              </p>
            )}

            <div className="flex justify-end mt-3">
              <Button onClick={handleSaveProfile} disabled={profileSaving} size="sm">
                {profileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 2 — Allergies */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Allergies</h3>

            {allergies.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {allergies.map((a) => (
                  <li key={a.AllergyID} className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.Name}</p>
                      {a.Reaction && (
                        <p className="text-xs text-muted-foreground truncate">{a.Reaction}</p>
                      )}
                    </div>
                    <Badge className={severityColors[a.Severity.toLowerCase()] ?? "bg-gray-100 text-gray-700"}>
                      {a.Severity}
                    </Badge>
                    <button
                      onClick={() => handleDeleteAllergy(a.AllergyID)}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete allergy"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No allergies on file.</p>
            )}

            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={allergyForm.Name}
                  onChange={(e) => setAllergyForm({ ...allergyForm, Name: e.target.value })}
                  placeholder="e.g. Penicillin"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAllergy(); } }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <select
                  value={allergyForm.Severity}
                  onChange={(e) => setAllergyForm({ ...allergyForm, Severity: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
                >
                  {SEVERITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Reaction (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={allergyForm.Reaction}
                    onChange={(e) => setAllergyForm({ ...allergyForm, Reaction: e.target.value })}
                    placeholder="e.g. Hives"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAllergy(); } }}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddAllergy}
                    disabled={allergyAdding || !allergyForm.Name.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border" />

          {/* Section 3 — Chronic Conditions */}
          <section>
            <h3 className="text-sm font-semibold mb-3">Chronic Conditions</h3>

            {conditions.length > 0 ? (
              <ul className="space-y-2 mb-4">
                {conditions.map((c) => (
                  <li key={c.ConditionID} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm">{c.Name}</span>
                    <button
                      onClick={() => handleDeleteCondition(c.ConditionID)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete condition"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No conditions on file.</p>
            )}

            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">Condition Name</Label>
                <Input
                  value={conditionName}
                  onChange={(e) => setConditionName(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCondition(); } }}
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddCondition}
                disabled={conditionAdding || !conditionName.trim()}
              >
                Add
              </Button>
            </div>
          </section>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
