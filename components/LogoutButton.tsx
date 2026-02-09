"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? "Logging out..." : "Log out"}
    </Button>
  );
}
