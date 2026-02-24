import { prisma } from "@/lib/prisma";
import { AuditAction } from "@/generated/prisma/client";

export async function writeAuditLog({
  userId,
  action,
  ipAddress,
  details,
}: {
  userId?: string | null;
  action: AuditAction;
  ipAddress: string;
  details?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        UserID: userId ?? null,
        Action: action,
        IPAddress: ipAddress,
        Details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (err) {
    console.error("Audit log write failed:", err);
  }
}
