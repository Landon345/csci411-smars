import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AuditLogTable } from "./AuditLogTable";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";

export default async function AuditLogPage() {
  const user = await getSession();
  if (!user || user.Role !== "admin") redirect("/login");

  const logs = await prisma.auditLog.findMany({
    include: {
      User: {
        select: { Email: true, FirstName: true, LastName: true },
      },
    },
    orderBy: { CreatedAt: "desc" },
    take: 200,
  });

  const serialized = logs.map((log) => ({
    ...log,
    CreatedAt: log.CreatedAt.toISOString(),
  }));

  return (
    <>
      <header className="mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-medium tracking-tight">
          <ClipboardDocumentCheckIcon className="h-6 w-6" />
          Audit Log
        </h1>
        <p className="text-sm text-muted-foreground">
          Recent system activity across all users.
        </p>
      </header>

      <AuditLogTable logs={serialized} />
    </>
  );
}
