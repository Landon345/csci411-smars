"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ChronicCondition {
  ConditionID: string;
  Name: string;
}

interface Props {
  initialConditions: ChronicCondition[];
}

export default function PatientConditionManager({ initialConditions }: Props) {
  const [conditions, setConditions] = useState<ChronicCondition[]>(initialConditions);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/patient/conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Name: name.trim() }),
      });

      if (res.ok) {
        const { condition } = await res.json();
        setConditions((prev) => [condition, ...prev]);
        setName("");
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to add condition.");
      }
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/patient/conditions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setConditions((prev) => prev.filter((c) => c.ConditionID !== id));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Chronic Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conditions.length > 0 && (
          <ul className="space-y-2">
            {conditions.map((c) => (
              <li key={c.ConditionID} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <p className="text-sm">{c.Name}</p>
                <button
                  onClick={() => handleDelete(c.ConditionID)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove condition"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add Condition</p>
          <div className="space-y-1.5">
            <Label>Condition Name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Type 2 Diabetes"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={adding || !name.trim()}>
              {adding ? "Adding..." : "Add Condition"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
