"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TrashIcon } from "@heroicons/react/24/outline";

export default function DangerZone() {
  const router = useRouter();
  const [deregisterPassword, setDeregisterPassword] = useState("");
  const [deregisterError, setDeregisterError] = useState("");
  const [isDeregistering, setIsDeregistering] = useState(false);
  const [showDeregisterSheet, setShowDeregisterSheet] = useState(false);

  function handleSheetOpenChange(open: boolean) {
    setShowDeregisterSheet(open);
    if (!open) {
      setDeregisterPassword("");
      setDeregisterError("");
    }
  }

  async function handleDeregister() {
    setDeregisterError("");
    setIsDeregistering(true);

    try {
      const res = await fetch("/api/user/deregister", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deregisterPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setDeregisterError(data.error || "Failed to deregister");
        return;
      }

      router.push("/login");
    } catch {
      setDeregisterError("An unexpected error occurred");
    } finally {
      setIsDeregistering(false);
    }
  }

  return (
    <>
      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
        <Card className="border-destructive/20 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Deregister Account</Label>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Sheet open={showDeregisterSheet} onOpenChange={handleSheetOpenChange}>
              <SheetTrigger asChild>
                <Button variant="destructive">
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Deregister
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="text-destructive">Deregister Account</SheetTitle>
                  <SheetDescription>
                    This is a permanent action. Please read the warnings below carefully.
                  </SheetDescription>
                </SheetHeader>
                <SheetBody className="space-y-6">
                  <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                    <p className="font-bold mb-2 flex items-center gap-2">
                      ⚠️ Warning 1: Permanent Data Loss
                    </p>
                    <p>All your appointments, medical records, and prescriptions will be permanently deleted from our system.</p>
                  </div>

                  <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                    <p className="font-bold mb-2 flex items-center gap-2">
                      ⚠️ Warning 2: No Recovery
                    </p>
                    <p>Once deleted, your account cannot be recovered. You will have to register as a new user if you wish to use the system again.</p>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="deregister-password">Confirm with Password</Label>
                      <Input
                        id="deregister-password"
                        type="password"
                        placeholder="Enter your password"
                        value={deregisterPassword}
                        onChange={(e) => setDeregisterPassword(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && deregisterPassword && !isDeregistering) {
                            handleDeregister();
                          }
                        }}
                      />
                      {deregisterError && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          {deregisterError}
                        </p>
                      )}
                    </div>
                  </div>
                </SheetBody>
                <SheetFooter>
                  <div className="flex flex-col gap-3 w-full">
                    <Button
                      variant="destructive"
                      disabled={!deregisterPassword || isDeregistering}
                      onClick={handleDeregister}
                      className="w-full"
                    >
                      {isDeregistering ? "Deleting account..." : "Yes, permanently delete my account"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSheetOpenChange(false)}
                      disabled={isDeregistering}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </Card>
      </section>
    </>
  );
}
