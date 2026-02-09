"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans selection:bg-zinc-200 dark:bg-black dark:selection:bg-zinc-800">
      <div className="w-full max-w-sm p-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                />
              </svg>
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
              {isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>
          </form>

          {/* Development Links */}
          <div className="flex flex-col space-y-4 text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => alert("Resend logic goes here!")}
            >
              Did not receive the code?{" "}
              <span className="underline">Resend</span>
            </button>

            {/* QUICK LINK BYPASS */}
            <div className="pt-4">
              <Separator className="mb-4" />
              <Link
                href="/dashboard"
                className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-orange-500 transition-colors"
              >
                Skip Verification (Dev Only) →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
