"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const resetSchema = z
  .object({
    Password: z.string().min(8, "Password must be at least 8 characters"),
    ConfirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.Password === data.ConfirmPassword, {
    message: "Passwords do not match",
    path: ["ConfirmPassword"],
  });

type ResetInput = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetInput) => {
    setServerError(null);
    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.Password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Something went wrong");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Unknown Error");
      }
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans selection:bg-zinc-200 dark:bg-black dark:selection:bg-zinc-800">
        <div className="w-full max-w-sm p-8 text-center space-y-4">
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            Invalid reset link. No token provided.
          </div>
          <Button variant="outline" className="h-11 w-full" asChild>
            <Link href="/forgot-password">Request a new reset link</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans selection:bg-zinc-200 dark:bg-black dark:selection:bg-zinc-800">
      <div className="w-full max-w-sm p-8">
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black">
              <span className="text-lg font-bold italic">S</span>
            </div>
            <h1 className="text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
              Set new password
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below
            </p>
          </div>

          {success ? (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                Password reset successful! Redirecting to login...
              </div>
              <Button variant="outline" className="h-11 w-full" asChild>
                <Link href="/login">Go to Sign In</Link>
              </Button>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive text-center">
                  {serverError}
                  {serverError.includes("expired") && (
                    <div className="mt-2">
                      <Link
                        href="/forgot-password"
                        className="underline hover:text-foreground"
                      >
                        Request a new reset link
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New Password</Label>
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    {...register("ConfirmPassword")}
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    aria-invalid={!!errors.ConfirmPassword}
                  />
                  {errors.ConfirmPassword && (
                    <p className="text-[10px] text-destructive">
                      {errors.ConfirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-11 w-full"
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </form>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
