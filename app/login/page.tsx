"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// 1. Define the Login Schema
const loginSchema = z.object({
  Email: z.email("Please enter a valid email address"),
  Password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function SignIn() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.Email, // Matches the 'email' key in our API route
          password: data.Password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
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
                  href="#"
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
              disabled={isSubmitting}
              className="mt-2 h-11 w-full"
            >
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
            <Link href="/register">Create an account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
