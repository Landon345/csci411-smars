"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950/30 dark:text-red-400 text-center">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email Address
              </label>
              <input
                {...register("Email")}
                type="email"
                placeholder="name@example.com"
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition-all dark:bg-zinc-950 dark:text-zinc-100 ${
                  errors.Email
                    ? "border-red-500"
                    : "border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-50"
                }`}
              />
              {errors.Email && (
                <p className="text-[10px] text-red-500">
                  {errors.Email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Password
                </label>
                <Link
                  href="#"
                  className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  Forgot?
                </Link>
              </div>
              <input
                {...register("Password")}
                type="password"
                placeholder="••••••••"
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm outline-none transition-all dark:bg-zinc-950 dark:text-zinc-100 ${
                  errors.Password
                    ? "border-red-500"
                    : "border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-50"
                }`}
              />
              {errors.Password && (
                <p className="text-[10px] text-red-500">
                  {errors.Password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-50 px-2 text-zinc-500 dark:bg-black dark:text-zinc-400">
                New to S.M.A.R.S?
              </span>
            </div>
          </div>

          <Link
            href="/register"
            className="flex h-11 w-full items-center justify-center rounded-lg border border-zinc-200 bg-transparent px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
