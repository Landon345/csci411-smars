"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";

// 1. Define the Validation Schema
const registerSchema = z.object({
  FirstName: z.string().min(2, "First name is required"),
  LastName: z.string().min(2, "Last name is required"),
  Email: z.email("Invalid email address"),
  Phone: z
    .string()
    .min(10, "Phone number is too short")
    .optional()
    .or(z.literal("")),
  SSN: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "Must be in XXX-XX-XXXX format"),
  Password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function Register() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  // 2. Initialize the Form
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  // 3. Handle Form Submission
  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Registration failed");
      }

      router.push("/verify-email");
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Unknown Error");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans selection:bg-zinc-200 dark:bg-black dark:selection:bg-zinc-800">
      <div className="w-full max-w-xl p-8">
        <div className="space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
              Create Account
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Secure your StrideSync medical profile.
            </p>
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500 dark:bg-red-950/30 dark:text-red-400">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  First Name
                </label>
                <input
                  {...register("FirstName")}
                  className={`w-full rounded-lg border bg-white px-4 py-2 text-sm outline-none transition-all dark:bg-zinc-950 ${
                    errors.FirstName
                      ? "border-red-500"
                      : "border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-50"
                  }`}
                />
                {errors.FirstName && (
                  <p className="text-[10px] text-red-500">
                    {errors.FirstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Last Name
                </label>
                <input
                  {...register("LastName")}
                  className={`w-full rounded-lg border bg-white px-4 py-2 text-sm outline-none transition-all dark:bg-zinc-950 ${
                    errors.LastName
                      ? "border-red-500"
                      : "border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-50"
                  }`}
                />
                {errors.LastName && (
                  <p className="text-[10px] text-red-500">
                    {errors.LastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Email Address
              </label>
              <input
                {...register("Email")}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-sm outline-none transition-all dark:bg-zinc-950 ${
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Phone (Optional)
                </label>
                <input
                  {...register("Phone")}
                  placeholder="1234567890"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none transition-all focus:border-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  SSN (XXX-XX-XXXX)
                </label>
                <input
                  {...register("SSN")}
                  className={`w-full rounded-lg border bg-white px-4 py-2 text-sm outline-none transition-all dark:bg-zinc-950 ${
                    errors.SSN
                      ? "border-red-500"
                      : "border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-50"
                  }`}
                />
                {errors.SSN && (
                  <p className="text-[10px] text-red-500">
                    {errors.SSN.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Password
              </label>
              <input
                type="password"
                {...register("Password")}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-sm outline-none transition-all dark:bg-zinc-950 ${
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
              className="mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
