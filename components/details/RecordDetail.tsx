"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { parseLocalDate } from "@/lib/format";
import {
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

export interface DetailRecord {
  RecordID: string;
  VisitDate: string;
  Type: string;
  ChiefComplaint: string;
  DiagnosisCode: string;
  DiagnosisDesc: string;
  TreatmentPlan: string;
  HeartRate?: number | null;
  BloodPressure?: string | null;
  Temperature?: number | null;
  Weight?: number | null;
  Height?: number | null;
  FollowUp?: string | null;
  Patient?: { FirstName: string; LastName: string };
  Doctor?: { FirstName: string; LastName: string };
  Appointment?: { Date: string; Type: string; Reason: string } | null;
}

interface RecordDoc {
  DocumentID: string;
  FileName: string;
  ContentType: string;
  SizeBytes: number;
  UploadedAt: string;
  downloadUrl: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  office_visit: "Office Visit",
  lab_result: "Lab Result",
  imaging: "Imaging",
  referral: "Referral",
  procedure_note: "Procedure Note",
};

const APPT_TYPE_LABELS: Record<string, string> = {
  checkup: "Checkup",
  follow_up: "Follow-up",
  consultation: "Consultation",
  procedure: "Procedure",
  emergency: "Emergency",
};

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
  "image/png": "png",
  "image/jpeg": "jpg",
};
const MAX_BYTES = 20 * 1024 * 1024;

function formatDate(d: string) {
  return parseLocalDate(d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

interface Props {
  record: DetailRecord | null;
  onClose: () => void;
  actions?: React.ReactNode;
  role?: "doctor" | "patient";
}

export function RecordDetail({ record, onClose, actions, role }: Props) {
  const [documents, setDocuments] = useState<RecordDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasVitals =
    record &&
    (record.HeartRate != null ||
      record.BloodPressure != null ||
      record.Temperature != null ||
      record.Weight != null ||
      record.Height != null);

  // Fetch documents whenever the selected record changes
  useEffect(() => {
    if (!record || !role) {
      setDocuments([]);
      return;
    }
    setDocsLoading(true);
    setUploadError(null);
    const endpoint =
      role === "doctor"
        ? `/api/doctor/records/${record.RecordID}/documents`
        : `/api/patient/records/${record.RecordID}/documents`;
    fetch(endpoint)
      .then((r) => r.json())
      .then(({ documents }) => setDocuments(documents ?? []))
      .catch(() => {})
      .finally(() => setDocsLoading(false));
  }, [record?.RecordID, role]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!record) return;
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
        `/api/doctor/records/${record.RecordID}/documents/presign`,
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
      const saveRes = await fetch(`/api/doctor/records/${record.RecordID}/documents`, {
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
    if (!record) return;
    setDeletingId(docId);
    try {
      const res = await fetch(
        `/api/doctor/records/${record.RecordID}/documents/${docId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.DocumentID !== docId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Sheet open={!!record} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Medical Record</SheetTitle>
          {record && (
            <SheetDescription>{formatDate(record.VisitDate)}</SheetDescription>
          )}
        </SheetHeader>

        {record && (
          <SheetBody>
            <div className="mb-5">
              <Badge variant="secondary">
                {TYPE_LABELS[record.Type] ?? record.Type}
              </Badge>
            </div>

            <dl className="space-y-4">
              {record.Patient && (
                <Field
                  label="Patient"
                  value={`${record.Patient.FirstName} ${record.Patient.LastName}`}
                />
              )}
              {record.Doctor && (
                <Field
                  label="Doctor"
                  value={`Dr. ${record.Doctor.FirstName} ${record.Doctor.LastName}`}
                />
              )}
              <Field label="Chief Complaint" value={record.ChiefComplaint} />
              <Field
                label="Diagnosis"
                value={`${record.DiagnosisCode} — ${record.DiagnosisDesc}`}
              />
              <Field
                label="Treatment Plan"
                value={
                  <span className="whitespace-pre-wrap">{record.TreatmentPlan}</span>
                }
              />
              <Field
                label="Follow-Up Instructions"
                value={
                  record.FollowUp ? (
                    <span className="whitespace-pre-wrap">{record.FollowUp}</span>
                  ) : null
                }
              />

              {hasVitals && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Vitals
                  </dt>
                  <dd className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {record.HeartRate != null && (
                      <span>
                        <span className="text-muted-foreground">HR: </span>
                        {record.HeartRate} bpm
                      </span>
                    )}
                    {record.BloodPressure && (
                      <span>
                        <span className="text-muted-foreground">BP: </span>
                        {record.BloodPressure}
                      </span>
                    )}
                    {record.Temperature != null && (
                      <span>
                        <span className="text-muted-foreground">Temp: </span>
                        {record.Temperature}°F
                      </span>
                    )}
                    {record.Weight != null && (
                      <span>
                        <span className="text-muted-foreground">Weight: </span>
                        {record.Weight} lbs
                      </span>
                    )}
                    {record.Height != null && (
                      <span>
                        <span className="text-muted-foreground">Height: </span>
                        {record.Height} in
                      </span>
                    )}
                  </dd>
                </div>
              )}

              {record.Appointment && (
                <Field
                  label="From Appointment"
                  value={`${formatDate(record.Appointment.Date)} · ${APPT_TYPE_LABELS[record.Appointment.Type] ?? record.Appointment.Type}`}
                />
              )}
            </dl>

            {/* Documents section */}
            {role && (
              <div className="mt-6 border-t pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <PaperClipIcon className="h-3.5 w-3.5" />
                    Attachments
                  </dt>
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

                {docsLoading ? (
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
            )}

            {actions && <div className="mt-6 flex flex-col gap-2">{actions}</div>}
          </SheetBody>
        )}
      </SheetContent>
    </Sheet>
  );
}
