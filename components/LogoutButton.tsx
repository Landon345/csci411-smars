"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    try {
      await fetch("/api/logout", { method: "POST" });

      // Refresh the page or redirect to home/login
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="h-9 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
    >
      {isPending ? "Logging out..." : "Log out"}
    </button>
  );
}
