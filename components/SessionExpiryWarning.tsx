"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

const WARNING_BEFORE_MS = 5 * 60 * 1000; // show warning 5 minutes before expiry

export function SessionExpiryWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const router = useRouter();

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setupTimers = useCallback(async () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    try {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return;
      const { expiresAt } = (await res.json()) as { expiresAt: number };

      const msUntilExpiry = expiresAt - Date.now();
      if (msUntilExpiry <= 0) {
        router.push("/login");
        return;
      }

      // Redirect automatically when the session expires
      expiryTimerRef.current = setTimeout(() => {
        router.push("/login");
      }, msUntilExpiry);

      const startCountdown = (initialSeconds: number) => {
        setShowWarning(true);
        setSecondsLeft(initialSeconds);
        countdownRef.current = setInterval(() => {
          setSecondsLeft((s) => {
            if (s <= 1) {
              clearInterval(countdownRef.current!);
              return 0;
            }
            return s - 1;
          });
        }, 1000);
      };

      const msUntilWarning = msUntilExpiry - WARNING_BEFORE_MS;
      if (msUntilWarning > 0) {
        warningTimerRef.current = setTimeout(() => {
          startCountdown(WARNING_BEFORE_MS / 1000);
        }, msUntilWarning);
      } else {
        // Already inside the 5-minute window — show immediately
        startCountdown(Math.max(0, Math.floor(msUntilExpiry / 1000)));
      }
    } catch {
      // Silently ignore — a session check failure should not break the UI
    }
  }, [router]);

  useEffect(() => {
    setupTimers();
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [setupTimers]);

  const handleStayLoggedIn = async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        setShowWarning(false);
        setupTimers();
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

  if (!showWarning) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay =
    secondsLeft > 0
      ? `${minutes}:${secs.toString().padStart(2, "0")}`
      : "now";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expiry-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div className="bg-background rounded-xl shadow-xl border p-6 max-w-sm w-full mx-4 space-y-4">
        <div className="space-y-1">
          <h2 id="session-expiry-title" className="text-base font-semibold">
            Session expiring soon
          </h2>
          <p className="text-sm text-muted-foreground">
            Your session will expire in{" "}
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {timeDisplay}
            </span>
            . Would you like to stay logged in?
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 h-9 rounded-md bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
          >
            Stay logged in
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 h-9 rounded-md border text-sm font-medium hover:bg-zinc-100 transition-colors dark:hover:bg-zinc-800"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
