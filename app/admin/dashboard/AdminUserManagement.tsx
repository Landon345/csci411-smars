"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.UserID}>
                <TableCell className="font-medium">
                  {user.FirstName} {user.LastName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.Email}
                </TableCell>
                <TableCell>
                  <select
                    value={user.Role}
                    onChange={(e) =>
                      handleRoleChange(user.UserID, e.target.value)
                    }
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.CreatedAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
