"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XMarkIcon } from "@heroicons/react/24/outline";

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

interface Allergy {
  AllergyID: string;
  Name: string;
  Severity: string;
  Reaction?: string | null;
}

interface Props {
  initialAllergies: Allergy[];
}

export default function PatientAllergyManager({ initialAllergies }: Props) {
  const [allergies, setAllergies] = useState<Allergy[]>(initialAllergies);
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState("low");
  const [reaction, setReaction] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/patient/allergies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Name: name.trim(), Severity: severity, Reaction: reaction.trim() || null }),
      });

      if (res.ok) {
        const { allergy } = await res.json();
        setAllergies((prev) => [allergy, ...prev]);
        setName("");
        setSeverity("low");
        setReaction("");
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to add allergy.");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/patient/allergies/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAllergies((prev) => prev.filter((a) => a.AllergyID !== id));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Allergies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allergies.length > 0 && (
          <ul className="space-y-2">
            {allergies.map((a) => (
              <li key={a.AllergyID} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{a.Name}</p>
                  {a.Reaction && (
                    <p className="text-xs text-muted-foreground truncate">{a.Reaction}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={severityColors[a.Severity]}>{a.Severity}</Badge>
                  <button
                    onClick={() => handleDelete(a.AllergyID)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove allergy"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add Allergy</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Penicillin"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none"
              >
                {SEVERITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Reaction (optional)</Label>
              <Input
                type="text"
                value={reaction}
                onChange={(e) => setReaction(e.target.value)}
                placeholder="e.g. Hives, difficulty breathing"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={adding || !name.trim()}>
              {adding ? "Adding..." : "Add Allergy"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
