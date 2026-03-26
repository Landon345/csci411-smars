"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { BookAppointmentModal } from "@/components/appointments/BookAppointmentModal";
import { getAvatarColor, getInitials } from "@/lib/avatarColor";

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
  photoUrl?: string | null;
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

const DEGREE_LABELS: Record<string, string> = {
  MD: "Doctor of Medicine",
  DO: "Doctor of Osteopathic Medicine",
  NP: "Nurse Practitioner",
  PA: "Physician Associate",
};

function degreeBadgeClass(degree: string) {
  if (degree === "MD" || degree === "DO") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  }
  return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
}

export default function FindADoctorPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

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
    <TooltipProvider>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col overflow-hidden py-0 bg-gradient-to-br from-primary to-accent border-0">
              {/* Name */}
              <div className="px-6 pt-5 pb-16 flex justify-center">
                <Skeleton className="h-5 w-36 bg-white/20" />
              </div>
              {/* Avatar */}
              <div className="-mt-16 flex justify-center">
                <div className="p-[3px] rounded-full bg-gradient-to-tl from-primary to-accent">
                  <Skeleton className="h-32 w-32 rounded-full bg-white/20" />
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 flex flex-col items-center pt-1">
                <Skeleton className="h-4 w-32 mb-1 bg-white/20" />
                <Skeleton className="h-3 w-24 bg-white/20" />
                <div className="flex w-full divide-x divide-white/20 border-t border-b border-white/20 mt-4 py-3 px-0">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <Skeleton className="h-4 w-8 bg-white/20" />
                    <Skeleton className="h-3 w-12 bg-white/20" />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <Skeleton className="h-4 w-8 bg-white/20" />
                    <Skeleton className="h-3 w-16 bg-white/20" />
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <Skeleton className="h-4 w-8 bg-white/20" />
                    <Skeleton className="h-3 w-14 bg-white/20" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 px-6 py-4 w-full">
                  <Skeleton className="h-3 w-full bg-white/20" />
                  <Skeleton className="h-3 w-5/6 bg-white/20" />
                  <Skeleton className="h-3 w-4/6 bg-white/20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No doctors found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => {
            const p = d.DoctorProfile;
            const bioSnippet = p?.Bio
              ? p.Bio.length > 120 ? p.Bio.slice(0, 120) + "…" : p.Bio
              : null;
            const avatarStyle = getAvatarColor(d.UserID);
            const initials = getInitials(d.FirstName, d.LastName);

            return (
              <Card
                key={d.UserID}
                className="relative flex flex-col overflow-hidden py-0 cursor-pointer group bg-gradient-to-br from-primary to-accent border-0"
                onClick={() => setBookingDoctor(d)}
              >
                {/* Name */}
                <div className="px-6 pt-5 pb-16 text-center">
                  <h3 className="text-base font-semibold text-white">
                    Dr. {d.FirstName} {d.LastName}
                  </h3>
                </div>

                {/* Avatar — gradient border wrapper goes opposite direction to card */}
                <div className="-mt-16 flex justify-center">
                  <div className="p-[3px] rounded-full bg-gradient-to-tl from-primary to-accent shadow-md">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={d.photoUrl ?? undefined} alt={`Dr. ${d.FirstName} ${d.LastName}`} />
                      <AvatarFallback style={avatarStyle} className="text-2xl font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col text-center pt-1">
                  <p className="font-semibold text-sm px-6 text-white">
                    {p?.Specialty ?? "General Practice"}
                  </p>
                  <p className="text-xs px-6 mt-0.5 text-white/70">
                    {p?.SubSpecialties?.length ? p.SubSpecialties.join(" · ") : "General Focus"}
                  </p>

                  {/* Stats row */}
                  <div className="flex divide-x divide-white/20 border-t border-b border-white/20 mt-4 py-3">
                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm font-bold text-white">{p?.Degree ?? "—"}</span>
                        </TooltipTrigger>
                        <TooltipContent>{p?.Degree ? (DEGREE_LABELS[p.Degree] ?? p.Degree) : "No degree on file"}</TooltipContent>
                      </Tooltip>
                      <span className="text-xs text-white/70">Degree</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-white">{p?.BoardCertified ? "Yes" : "No"}</span>
                      <span className="text-xs text-white/70">Board Cert.</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-sm font-bold text-white">{p?.Telehealth ? "Yes" : "No"}</span>
                      <span className="text-xs text-white/70">Telehealth</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="flex-1 text-sm text-white/70 px-6 py-4">
                    {bioSnippet ?? "No bio available."}
                  </p>
                </div>

                {/* Hover overlay — gradient shadow animates up from bottom */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center pb-4">
                  <span className="text-sm font-semibold text-white">Book Appointment →</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BookAppointmentModal
        doctor={bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        onBooked={() => setBookingDoctor(null)}
      />
    </TooltipProvider>
  );
}
