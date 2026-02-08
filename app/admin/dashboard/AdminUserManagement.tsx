"use client";

import { useEffect, useState } from "react";

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
        <p className="text-sm text-zinc-500">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      <header className="mb-4">
        <h2 className="text-xl font-medium tracking-tight">
          User Management
        </h2>
        <p className="text-sm text-zinc-500">
          Manage user accounts and roles.
        </p>
      </header>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.UserID}
                className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                  {user.FirstName} {user.LastName}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500">
                  {user.Email}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.Role}
                    onChange={(e) =>
                      handleRoleChange(user.UserID, e.target.value)
                    }
                    className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-50 outline-none"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-zinc-500">
                  {new Date(user.CreatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
