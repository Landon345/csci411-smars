"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

export interface RecordDoc {
  DocumentID: string;
  FileName: string;
  ContentType: string;
  SizeBytes: number;
  UploadedAt: string;
  downloadUrl: string | null;
}

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/png": "png",
  "image/jpeg": "jpg",
};
const MAX_BYTES = 20 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith("image/")) {
    return <PhotoIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  return <DocumentTextIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

interface Props {
  recordId: string;
  role: "doctor" | "patient";
  /** Called after a successful upload or delete so parents can refresh counts. */
  onCountChange?: (delta: number) => void;
}

export function RecordDocuments({ recordId, role, onCountChange }: Props) {
  const [documents, setDocuments] = useState<RecordDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    setUploadError(null);
    const endpoint =
      role === "doctor"
        ? `/api/doctor/records/${recordId}/documents`
        : `/api/patient/records/${recordId}/documents`;
    fetch(endpoint)
      .then((r) => r.json())
      .then(({ documents }) => setDocuments(documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [recordId, role]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    setUploadError(null);

    if (!ALLOWED_TYPES[file.type]) {
      setUploadError("Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, PNG, JPG");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("File is too large. Maximum size is 20 MB.");
      return;
    }

    setUploading(true);
    try {
      setUploadProgress("Preparing upload…");
      const presignRes = await fetch(
        `/api/doctor/records/${recordId}/documents/presign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: file.type,
            sizeBytes: file.size,
            fileName: file.name,
          }),
        }
      );
      if (!presignRes.ok) {
        const { error } = await presignRes.json();
        throw new Error(error ?? "Could not obtain upload URL");
      }
      const { uploadUrl, key } = await presignRes.json();

      setUploadProgress("Uploading…");
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!s3Res.ok) throw new Error("Upload to storage failed");

      setUploadProgress("Saving…");
      const saveRes = await fetch(`/api/doctor/records/${recordId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!saveRes.ok) throw new Error("Could not save document");
      const { document: newDoc } = await saveRes.json();
      setDocuments((prev) => [...prev, newDoc]);
      onCountChange?.(1);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    try {
      const res = await fetch(
        `/api/doctor/records/${recordId}/documents/${docId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.DocumentID !== docId));
        onCountChange?.(-1);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <PaperClipIcon className="h-3.5 w-3.5" />
          Attachments
        </p>
        {role === "doctor" && (
          <Button
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? uploadProgress ?? "Uploading…" : "Attach File"}
          </Button>
        )}
      </div>

      {uploadError && (
        <p className="text-xs font-medium text-destructive">{uploadError}</p>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading attachments…</p>
      ) : documents.length === 0 ? (
        <p className="text-xs text-muted-foreground">No attachments.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.DocumentID}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <DocIcon contentType={doc.ContentType} />
              <span className="flex-1 truncate font-medium" title={doc.FileName}>
                {doc.FileName}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatBytes(doc.SizeBytes)}
              </span>
              {doc.downloadUrl && (
                <a
                  href={doc.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </a>
              )}
              {role === "doctor" && (
                <button
                  disabled={deletingId === doc.DocumentID}
                  onClick={() => handleDelete(doc.DocumentID)}
                  title="Delete attachment"
                >
                  <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {role === "doctor" && (
        <input
          ref={fileInputRef}
          type="file"
          accept={Object.keys(ALLOWED_TYPES).join(",")}
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  );
}
