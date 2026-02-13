"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  Role: z.enum(["patient", "doctor"]),
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
            <p className="text-sm text-muted-foreground">
              Secure your Smars medical profile.
            </p>
          </div>

          {serverError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  {...register("FirstName")}
                  id="firstName"
                  aria-invalid={!!errors.FirstName}
                />
                {errors.FirstName && (
                  <p className="text-[10px] text-destructive">
                    {errors.FirstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  {...register("LastName")}
                  id="lastName"
                  aria-invalid={!!errors.LastName}
                />
                {errors.LastName && (
                  <p className="text-[10px] text-destructive">
                    {errors.LastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                {...register("Email")}
                id="email"
                aria-invalid={!!errors.Email}
              />
              {errors.Email && (
                <p className="text-[10px] text-destructive">
                  {errors.Email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  {...register("Phone")}
                  id="phone"
                  placeholder="1234567890"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ssn">SSN (XXX-XX-XXXX)</Label>
                <Input
                  {...register("SSN")}
                  id="ssn"
                  aria-invalid={!!errors.SSN}
                />
                {errors.SSN && (
                  <p className="text-[10px] text-destructive">
                    {errors.SSN.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>I am a...</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    value="patient"
                    {...register("Role")}
                    defaultChecked
                    className="accent-zinc-900 dark:accent-zinc-50"
                  />
                  Patient
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    value="doctor"
                    {...register("Role")}
                    className="accent-zinc-900 dark:accent-zinc-50"
                  />
                  Doctor
                </label>
              </div>
              {errors.Role && (
                <p className="text-[10px] text-destructive">
                  {errors.Role.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                {...register("Password")}
                id="password"
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
              className="mt-4 h-11 w-full"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
