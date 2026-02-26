"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DoctorProfile {
  ClinicalCategory: string | null;
  Specialty: string | null;
  Degree: string | null;
  BoardCertified: boolean;
  SubSpecialties: string[];
  Bio: string | null;
  Telehealth: boolean;
}

interface Doctor {
  UserID: string;
  FirstName: string;
  LastName: string;
  DoctorProfile: DoctorProfile | null;
}

type CategoryFilter = "all" | "primary_care" | "mental_health" | "surgical_specialist" | "medical_specialist" | "urgent_emergency";

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "primary_care", label: "Primary Care" },
  { value: "mental_health", label: "Mental Health" },
  { value: "surgical_specialist", label: "Surgical" },
  { value: "medical_specialist", label: "Medical Specialist" },
  { value: "urgent_emergency", label: "Urgent & ER" },
];

function degreeBadgeClass(degree: string) {
  if (degree === "MD" || degree === "DO") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
}

export default function FindADoctorPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/patient/doctors")
      .then((r) => r.json())
      .then(({ doctors }) => setDoctors(doctors ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = doctors
    .filter((d) =>
      categoryFilter === "all" || d.DoctorProfile?.ClinicalCategory === categoryFilter
    )
    .filter((d) => {
      const q = search.toLowerCase();
      return `${d.FirstName} ${d.LastName}`.toLowerCase().includes(q);
    });

  return (
    <>
      <header className="mb-6">
        <h2 className="text-xl font-medium tracking-tight">Find a Doctor</h2>
        <p className="text-sm text-muted-foreground">
          Browse doctors by specialty and book an appointment.
        </p>
      </header>

      <div className="mb-4">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={categoryFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setCategoryFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No doctors found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const p = d.DoctorProfile;
            const bioSnippet = p?.Bio
              ? p.Bio.length > 120 ? p.Bio.slice(0, 120) + "…" : p.Bio
              : null;

            return (
              <Card key={d.UserID}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    Dr. {d.FirstName} {d.LastName}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {p?.Degree && (
                      <Badge variant="secondary" className={degreeBadgeClass(p.Degree)}>
                        {p.Degree}
                      </Badge>
                    )}
                    {p?.BoardCertified && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      >
                        Board Certified
                      </Badge>
                    )}
                    {p?.Telehealth && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      >
                        Telehealth
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {p?.Specialty && (
                    <p>
                      <span className="text-muted-foreground">Specialty: </span>
                      {p.Specialty}
                    </p>
                  )}
                  {p?.SubSpecialties && p.SubSpecialties.length > 0 && (
                    <p>
                      <span className="text-muted-foreground">Focus: </span>
                      {p.SubSpecialties.join(" · ")}
                    </p>
                  )}
                  {bioSnippet && (
                    <p className="text-muted-foreground">{bioSnippet}</p>
                  )}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(`/patient/dashboard/appointments?doctor=${d.UserID}`)
                      }
                    >
                      Book Appointment →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
