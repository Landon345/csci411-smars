import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans selection:bg-zinc-200 dark:bg-black dark:selection:bg-zinc-800">
      <div className="w-full max-w-md p-8">
        <div className="space-y-6 text-center">
          {/* Logo / Brand */}
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black">
            <span className="text-xl font-bold">S</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
              S.M.A.R.S
            </h1>
            <p className="text-sm text-muted-foreground">
              Secure medical records
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button className="h-11 w-full" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
            <Button className="h-11 w-full" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
            <Button variant="outline" className="h-11 w-full" asChild>
              <Link href="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
