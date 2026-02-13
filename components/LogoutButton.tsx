"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/outline";

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
      <ArrowLeftStartOnRectangleIcon className="h-4 w-4" />
      {isPending ? "Logging out..." : "Log out"}
    </Button>
  );
}
