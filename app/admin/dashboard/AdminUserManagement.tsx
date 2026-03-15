"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, SortableHeader } from "@/components/ui/data-table";

interface UserRow {
  UserID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Role: string;
  CreatedAt: string;
}

export default function AdminUserManagement() {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get("search") ?? "";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo<ColumnDef<UserRow, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (row) => `${row.FirstName} ${row.LastName}`,
        meta: { label: "Name" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Name" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.FirstName} {row.original.LastName}
          </span>
        ),
      },
      {
        id: "email",
        accessorKey: "Email",
        meta: { label: "Email" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Email" />
        ),
        cell: ({ getValue }) => (
          <span className="text-muted-foreground">{getValue() as string}</span>
        ),
      },
      {
        id: "role",
        accessorKey: "Role",
        meta: { label: "Role" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Role" />
        ),
        cell: ({ getValue }) => (
          <span className="capitalize text-sm">{getValue() as string}</span>
        ),
      },
      {
        id: "createdAt",
        accessorFn: (row) => row.CreatedAt,
        sortingFn: "datetime",
        enableGlobalFilter: false,
        meta: { label: "Created" },
        header: ({ column }) => (
          <SortableHeader column={column} label="Created" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {new Date(row.original.CreatedAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      <header className="mb-4">
        <h2 className="text-xl font-medium tracking-tight">
          User Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage user accounts and roles.
        </p>
      </header>

      <DataTable
        data={users}
        columns={columns}
        searchPlaceholder="Search users..."
        initialFilter={searchParam}
      />
    </>
  );
}
