"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EnvelopeIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";

export default function InviteDoctorPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendInvite() {
    setError(null);
    setInviteUrl(null);
    setCopied(false);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to send invite");
        return;
      }

      setInviteUrl(data.inviteUrl);
      setEmail("");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Invite Doctor</h1>
        <p className="text-sm text-muted-foreground">
          Generate a single-use invite link for a doctor to register. The link expires in 48 hours.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="invite-email">Doctor&apos;s Email Address</Label>
        <div className="flex gap-2">
          <Input
            id="invite-email"
            type="email"
            placeholder="doctor@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && handleSendInvite()}
          />
          <Button onClick={handleSendInvite} disabled={loading || !email.trim()}>
            <EnvelopeIcon className="h-4 w-4" />
            {loading ? "Sending…" : "Send Invite"}
          </Button>
        </div>
      </div>

      {inviteUrl && (
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            Invite created successfully!
          </p>
          <Label htmlFor="invite-url">Invite Link</Label>
          <div className="flex gap-2">
            <Input id="invite-url" readOnly value={inviteUrl} className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={handleCopy} title="Copy to clipboard">
              <ClipboardDocumentIcon className="h-4 w-4" />
              <span className="sr-only">Copy</span>
            </Button>
          </div>
          {copied && (
            <p className="text-xs text-muted-foreground">Copied to clipboard!</p>
          )}
        </div>
      )}
    </div>
  );
}
