"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import ProfilePhotoUpload from "@/components/settings/ProfilePhotoUpload";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
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
  const dark = useSyncExternalStore(subscribe, getIsDark, () => false);

  function toggleTheme(checked: boolean) {
    document.documentElement.classList.toggle("dark", checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
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
        <ProfilePhotoUpload />
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

    </div>
  );
}
