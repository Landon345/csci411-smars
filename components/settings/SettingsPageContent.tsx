"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { SunIcon, MoonIcon, TrashIcon, CameraIcon } from "@heroicons/react/24/outline";
import { useSyncExternalStore } from "react";

function getIsDark() {
  if (typeof window === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

export default function SettingsPageContent() {
  const router = useRouter();
  const [deregisterPassword, setDeregisterPassword] = useState("");
  const [deregisterError, setDeregisterError] = useState("");
  const [isDeregistering, setIsDeregistering] = useState(false);
  const [showDeregisterSheet, setShowDeregisterSheet] = useState(false);

  const dark = useSyncExternalStore(subscribe, getIsDark, () => false);

  function toggleTheme(checked: boolean) {
    document.documentElement.classList.toggle("dark", checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
  }

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
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Photo Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Profile Photo</h2>
        <Card className="p-6">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
              <CameraIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Photo upload is not yet available.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Upload Photo
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  Remove
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <Separator />

      {/* Appearance Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Appearance</h2>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {dark ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
              <Switch checked={dark} onCheckedChange={toggleTheme} />
            </div>
          </div>
        </Card>
      </section>

      <Separator />

      {/* Danger Zone */}
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
    </div>
  );
}
