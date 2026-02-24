"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

interface AuditLogEntry {
  LogID: string;
  Action: string;
  IPAddress: string;
  Details: string | null;
  CreatedAt: string;
  User: {
    Email: string;
    FirstName: string;
    LastName: string;
  } | null;
}

const actionColors: Record<string, string> = {
  login_success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  login_failure: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  logout: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  record_viewed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  record_created: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  record_updated: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  prescription_created: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  prescription_updated: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  password_changed: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  role_changed: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  const columns = useMemo<ColumnDef<AuditLogEntry, unknown>[]>(
    () => [
      {
        id: "createdAt",
        accessorFn: (row) => row.CreatedAt,
        sortingFn: "datetime",
        meta: { label: "Timestamp" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Timestamp" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {new Date(row.original.CreatedAt).toLocaleString()}
          </span>
        ),
      },
      {
        id: "user",
        accessorFn: (row) => row.User?.Email ?? "—",
        meta: { label: "User" },
        header: ({ column }) => (
          <SortableHeader column={column} label="User" />
        ),
        cell: ({ row }) =>
          row.original.User ? (
            <div>
              <p className="font-medium text-sm">
                {row.original.User.FirstName} {row.original.User.LastName}
              </p>
              <p className="text-xs text-muted-foreground">{row.original.User.Email}</p>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          ),
      },
      {
        id: "action",
        accessorKey: "Action",
        meta: { label: "Action" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Action" />
        ),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={`text-xs font-mono ${actionColors[row.original.Action] ?? ""}`}
          >
            {row.original.Action.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        id: "ipAddress",
        accessorKey: "IPAddress",
        enableGlobalFilter: false,
        meta: { label: "IP Address" },
        header: ({ column }) => (
          <SortableHeader column={column} label="IP Address" />
        ),
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "details",
        accessorKey: "Details",
        enableSorting: false,
        enableGlobalFilter: false,
        meta: { label: "Details" },
        header: "Details",
        cell: ({ getValue }) => {
          const raw = getValue() as string | null;
          if (!raw) return <span className="text-muted-foreground text-xs">—</span>;
          const truncated = raw.length > 80 ? raw.slice(0, 80) + "…" : raw;
          return (
            <span className="font-mono text-xs text-muted-foreground" title={raw}>
              {truncated}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <DataTable
      data={logs}
      columns={columns}
      searchPlaceholder="Search audit log..."
    />
  );
}
