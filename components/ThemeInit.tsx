"use client";

if (typeof window !== "undefined") {
  const stored = localStorage.getItem("theme");
  const isDark =
    stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export default function ThemeInit() {
  return null;
}
