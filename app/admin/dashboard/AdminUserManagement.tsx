"use client";

import { useEffect, useMemo, useState } from "react";
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

  async function handleRoleChange(userId: string, newRole: string) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newRole }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.UserID === userId ? { ...u, Role: newRole } : u)),
      );
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
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <select
              value={row.original.Role}
              onChange={(e) =>
                handleRoleChange(row.original.UserID, e.target.value)
              }
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
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
      />
    </>
  );
}
