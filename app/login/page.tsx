"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  LockClosedIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

// 1. Define the Login Schema
const loginSchema = z.object({
  Email: z.email("Please enter a valid email address"),
  Password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SignIn() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function startLockoutTimer(lockedUntilIso: string) {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const tick = () => {
      const remaining = Math.ceil((new Date(lockedUntilIso).getTime() - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setSecondsLeft(null);
        setServerError(null);
      } else {
        setSecondsLeft(remaining);
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    setAttemptsRemaining(null);
    setSecondsLeft(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.Email,
          password: data.Password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (typeof errorData.attemptsRemaining === "number") {
          setAttemptsRemaining(errorData.attemptsRemaining);
        }
        if (typeof errorData.lockedUntil === "string") {
          startLockoutTimer(errorData.lockedUntil);
        }
        throw new Error(errorData.error || "Invalid email or password");
      }

      // Success! Redirect to dashboard
      router.push("/dashboard");
      router.refresh(); // Refresh to ensure middleware detects the new cookie
    } catch (err) {
      if (err instanceof Error) {
        console.log(err);
        setServerError(err.message);
      } else {
        console.log(err);
        setServerError("Unknown Error");
      }
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans selection:bg-zinc-200 dark:bg-black dark:selection:bg-zinc-800">
      <div className="w-full max-w-sm p-8">
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black">
              <span className="text-lg font-bold italic">S</span>
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
              Welcome back
            </h1>
          </div>

          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
              {serverError}
            </div>
          )}

          {secondsLeft !== null && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 text-center dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
              <p className="text-sm font-medium">Account locked</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest">
                {formatCountdown(secondsLeft)}
              </p>
              <p className="mt-1 text-xs">Try again when the timer reaches 00:00</p>
            </div>
          )}

          {attemptsRemaining !== null && secondsLeft === null && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 text-center dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
              {attemptsRemaining === 1
                ? "1 attempt remaining before your account is locked."
                : `${attemptsRemaining} attempts remaining before your account is locked.`}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                {...register("Email")}
                id="email"
                type="email"
                placeholder="name@example.com"
                aria-invalid={!!errors.Email}
              />
              {errors.Email && (
                <p className="text-[10px] text-destructive">
                  {errors.Email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                {...register("Password")}
                id="password"
                type="password"
                placeholder="••••••••"
                aria-invalid={!!errors.Password}
              />
              {errors.Password && (
                <p className="text-[10px] text-destructive">
                  {errors.Password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || secondsLeft !== null}
              className="mt-2 h-11 w-full"
            >
              <LockClosedIcon className="h-4 w-4" />
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-50 px-2 text-muted-foreground dark:bg-black">
                New to S.M.A.R.S?
              </span>
            </div>
          </div>

          <Button variant="outline" className="h-11 w-full" asChild>
            <Link href="/register">
              <UserPlusIcon className="h-4 w-4" />
              Create an account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
