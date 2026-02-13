"use client";

import { useSyncExternalStore } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getIsDark, () => false);

  function toggle(checked: boolean) {
    document.documentElement.classList.toggle("dark", checked);
    localStorage.setItem("theme", checked ? "dark" : "light");
  }

  return (
    <div className="flex items-center justify-between">
      <Label htmlFor="theme-toggle" className="text-xs text-muted-foreground cursor-pointer">
        Dark mode
      </Label>
      <Switch id="theme-toggle" checked={dark} onCheckedChange={toggle} />
    </div>
  );
}
