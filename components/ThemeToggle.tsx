"use client";

import { useSyncExternalStore } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

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
      <Label
        htmlFor="theme-toggle"
        className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer pr-2"
      >
        {dark ? (
          <MoonIcon className="h-3.5 w-3.5" />
        ) : (
          <SunIcon className="h-3.5 w-3.5" />
        )}
      </Label>
      <Switch id="theme-toggle" checked={dark} onCheckedChange={toggle} />
    </div>
  );
}
