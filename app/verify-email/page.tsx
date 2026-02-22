"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckBadgeIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// 1. Zod Schema for 6-Digit Code
const verifySchema = z.object({
  code: z
    .string()
    .min(6, "Code must be exactly 6 digits")
    .max(6, "Code must be exactly 6 digits")
    .regex(/^\d+$/, "Code must contain numbers only"),
});

type VerifyInput = z.infer<typeof verifySchema>;

export default function VerifyEmail() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyInput>({
    resolver: zodResolver(verifySchema),
  });

  const onSubmit = async (data: VerifyInput) => {
    setServerError(null);
    try {
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: data.code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid verification code");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("An unexpected error occurred");
      }
    }
  };

  const handleResend = async () => {
    setResendStatus(null);
    setIsResending(true);
    try {
      const response = await fetch("/api/resend-otp", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setResendStatus(data.error || "Failed to resend code");
      } else {
        setResendStatus("A new code has been sent to your email.");
      }
    } catch {
      setResendStatus("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans selection:bg-zinc-200 dark:bg-black dark:selection:bg-zinc-800">
      <div className="w-full max-w-sm p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black">
              <CheckBadgeIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
              Check your email
            </h1>
            <p className="text-sm text-muted-foreground">
              We have sent a 6-digit verification code to your email address.
            </p>
          </div>

          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                {...register("code")}
                id="code"
                type="text"
                maxLength={6}
                placeholder="123456"
                className="text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-normal"
                aria-invalid={!!errors.code}
              />
              {errors.code && (
                <p className="text-center text-[10px] text-destructive">
                  {errors.code.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 w-full"
            >
              <ShieldCheckIcon className="h-4 w-4" />
              {isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          {/* Resend */}
          <div className="flex flex-col space-y-2 text-center">
            <button
              type="button"
              disabled={isResending}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              onClick={handleResend}
            >
              Did not receive the code?{" "}
              <span className="inline-flex items-center gap-1 underline">
                <ArrowPathIcon className="h-3 w-3" />
                {isResending ? "Sending..." : "Resend"}
              </span>
            </button>
            {resendStatus && (
              <p className="text-xs text-center text-muted-foreground">
                {resendStatus}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
