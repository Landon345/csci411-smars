"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS = [
  { value: "", label: "Select category..." },
  { value: "primary_care", label: "Primary Care" },
  { value: "mental_health", label: "Mental Health" },
  { value: "surgical_specialist", label: "Surgical Specialist" },
  { value: "medical_specialist", label: "Medical Specialist" },
  { value: "urgent_emergency", label: "Urgent & Emergency" },
];

const DEGREE_OPTIONS = [
  { value: "", label: "Select degree..." },
  { value: "MD", label: "MD" },
  { value: "DO", label: "DO" },
  { value: "NP", label: "NP" },
  { value: "PA", label: "PA" },
];

interface ProfileForm {
  ClinicalCategory: string;
  Specialty: string;
  Degree: string;
  BoardCertified: boolean;
  SubSpecialties: string;
  Bio: string;
  Telehealth: boolean;
}

export default function DoctorProfileCard() {
  const [form, setForm] = useState<ProfileForm>({
    ClinicalCategory: "",
    Specialty: "",
    Degree: "",
    BoardCertified: false,
    SubSpecialties: "",
    Bio: "",
    Telehealth: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/doctor/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) return;
        setForm({
          ClinicalCategory: profile.ClinicalCategory ?? "",
          Specialty: profile.Specialty ?? "",
          Degree: profile.Degree ?? "",
          BoardCertified: profile.BoardCertified ?? false,
          SubSpecialties: (profile.SubSpecialties ?? []).join(", "),
          Bio: profile.Bio ?? "",
          Telehealth: profile.Telehealth ?? false,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const subSpecialtiesArr = form.SubSpecialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ClinicalCategory: form.ClinicalCategory || null,
          Specialty: form.Specialty || null,
          Degree: form.Degree || null,
          BoardCertified: form.BoardCertified,
          SubSpecialties: subSpecialtiesArr,
          Bio: form.Bio || null,
          Telehealth: form.Telehealth,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Profile saved successfully." });
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error ?? "Failed to save profile." });
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Doctor Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Clinical Category</Label>
              <select
                value={form.ClinicalCategory}
                onChange={(e) => setForm({ ...form, ClinicalCategory: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Specialty</Label>
              <Input
                type="text"
                value={form.Specialty}
                onChange={(e) => setForm({ ...form, Specialty: e.target.value })}
                placeholder="e.g. Family Medicine"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Degree</Label>
              <select
                value={form.Degree}
                onChange={(e) => setForm({ ...form, Degree: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
              >
                {DEGREE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Sub-specialties</Label>
              <Input
                type="text"
                value={form.SubSpecialties}
                onChange={(e) => setForm({ ...form, SubSpecialties: e.target.value })}
                placeholder="e.g. Diabetes Management, Hypertension"
              />
              <p className="text-xs text-muted-foreground">Comma-separated</p>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label>Bio</Label>
              <textarea
                value={form.Bio}
                onChange={(e) => setForm({ ...form, Bio: e.target.value })}
                maxLength={500}
                rows={4}
                placeholder="Brief professional bio..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none resize-none"
              />
              <p className="text-xs text-muted-foreground">{form.Bio.length}/500 characters</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="board-certified"
                type="checkbox"
                checked={form.BoardCertified}
                onChange={(e) => setForm({ ...form, BoardCertified: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="board-certified">Board Certified</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="telehealth"
                type="checkbox"
                checked={form.Telehealth}
                onChange={(e) => setForm({ ...form, Telehealth: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="telehealth">Telehealth Available</Label>
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
