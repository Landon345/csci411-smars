import Link from "next/link";

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
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Secure medical records
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/register"
              className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Get Started
            </Link>

            <Link
              href="/dashboard"
              className="flex h-11 items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
