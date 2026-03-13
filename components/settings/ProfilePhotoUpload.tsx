"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CameraIcon, TrashIcon } from "@heroicons/react/24/outline";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ProfilePhotoUpload() {
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/profile-photo")
      .then((r) => r.json())
      .then(({ viewUrl }) => setViewUrl(viewUrl ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large. Maximum size is 5 MB.");
      return;
    }

    setUploading(true);
    try {
      // Step 1 — request presigned upload URL
      setProgress("Preparing upload…");
      const presignRes = await fetch("/api/user/profile-photo/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, sizeBytes: file.size }),
      });
      if (!presignRes.ok) {
        const { error } = await presignRes.json();
        throw new Error(error ?? "Could not obtain upload URL");
      }
      const { uploadUrl, key } = await presignRes.json();

      // Step 2 — upload directly to S3
      setProgress("Uploading…");
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error("Upload to storage failed");

      // Step 3 — save metadata and get view URL
      setProgress("Saving…");
      const saveRes = await fetch("/api/user/profile-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, contentType: file.type, sizeBytes: file.size }),
      });
      if (!saveRes.ok) throw new Error("Could not save photo");
      const { viewUrl } = await saveRes.json();
      setViewUrl(viewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  async function handleRemove() {
    if (!confirm("Remove your profile photo?")) return;
    setError(null);
    try {
      const res = await fetch("/api/user/profile-photo", { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove photo");
      setViewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Removal failed. Please try again.");
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="h-24 w-24 shrink-0 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/25 bg-muted flex items-center justify-center">
          {loading ? (
            <div className="h-full w-full animate-pulse rounded-full bg-muted-foreground/10" />
          ) : viewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={viewUrl} alt="Profile photo" className="h-full w-full object-cover" />
          ) : (
            <CameraIcon className="h-10 w-10 text-muted-foreground/40" />
          )}
        </div>

        {/* Controls */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            JPEG, PNG, WebP, or GIF · Max 5 MB
          </p>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          {progress && <p className="text-sm text-muted-foreground">{progress}</p>}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={uploading || loading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? progress ?? "Uploading…" : viewUrl ? "Change Photo" : "Upload Photo"}
            </Button>
            {viewUrl && !uploading && (
              <Button variant="ghost" size="sm" onClick={handleRemove}>
                <TrashIcon className="mr-1.5 h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />
    </Card>
  );
}
