"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

interface Doctor {
  UserID: string;
  FirstName: string;
  LastName: string;
}

interface PatientProfileData {
  BloodType?: string | null;
  InsuranceProvider?: string | null;
  InsurancePolicyNumber?: string | null;
  EmergencyContactName?: string | null;
  EmergencyContactPhone?: string | null;
  EmergencyContactRelationship?: string | null;
  PrimaryCarePhysicianID?: string | null;
}

interface Props {
  initialProfile: PatientProfileData | null;
  doctors: Doctor[];
}

interface ProfileForm {
  BloodType: string;
  InsuranceProvider: string;
  InsurancePolicyNumber: string;
  EmergencyContactName: string;
  EmergencyContactPhone: string;
  EmergencyContactRelationship: string;
  PrimaryCarePhysicianID: string;
}

export default function PatientProfileCard({ initialProfile, doctors }: Props) {
  const [form, setForm] = useState<ProfileForm>({
    BloodType: initialProfile?.BloodType ?? "",
    InsuranceProvider: initialProfile?.InsuranceProvider ?? "",
    InsurancePolicyNumber: initialProfile?.InsurancePolicyNumber ?? "",
    EmergencyContactName: initialProfile?.EmergencyContactName ?? "",
    EmergencyContactPhone: initialProfile?.EmergencyContactPhone ?? "",
    EmergencyContactRelationship: initialProfile?.EmergencyContactRelationship ?? "",
    PrimaryCarePhysicianID: initialProfile?.PrimaryCarePhysicianID ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/patient/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          BloodType: form.BloodType || null,
          InsuranceProvider: form.InsuranceProvider || null,
          InsurancePolicyNumber: form.InsurancePolicyNumber || null,
          EmergencyContactName: form.EmergencyContactName || null,
          EmergencyContactPhone: form.EmergencyContactPhone || null,
          EmergencyContactRelationship: form.EmergencyContactRelationship || null,
          PrimaryCarePhysicianID: form.PrimaryCarePhysicianID || null,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Medical profile saved successfully." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to save profile." });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Medical Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Blood Type</Label>
              <select
                value={form.BloodType}
                onChange={(e) => setForm({ ...form, BloodType: e.target.value })}
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
                value={form.PrimaryCarePhysicianID}
                onChange={(e) => setForm({ ...form, PrimaryCarePhysicianID: e.target.value })}
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
                type="text"
                value={form.InsuranceProvider}
                onChange={(e) => setForm({ ...form, InsuranceProvider: e.target.value })}
                placeholder="e.g. Blue Cross Blue Shield"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Policy Number</Label>
              <Input
                type="text"
                value={form.InsurancePolicyNumber}
                onChange={(e) => setForm({ ...form, InsurancePolicyNumber: e.target.value })}
                placeholder="e.g. XYZ123456789"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Emergency Contact Name</Label>
              <Input
                type="text"
                value={form.EmergencyContactName}
                onChange={(e) => setForm({ ...form, EmergencyContactName: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Emergency Contact Phone</Label>
              <Input
                type="text"
                value={form.EmergencyContactPhone}
                onChange={(e) => setForm({ ...form, EmergencyContactPhone: e.target.value })}
                placeholder="e.g. +1 (555) 000-0000"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label>Emergency Contact Relationship</Label>
              <Input
                type="text"
                value={form.EmergencyContactRelationship}
                onChange={(e) => setForm({ ...form, EmergencyContactRelationship: e.target.value })}
                placeholder="e.g. Spouse, Parent, Sibling"
              />
            </div>
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.type === "success"
                  ? "text-green-600 dark:text-green-400"
                  : "text-destructive"
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
