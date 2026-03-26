import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  UserPlusIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

export default async function Home() {
  const user = await getSession();
  if (user) redirect("/dashboard");
  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans selection:bg-secondary">
      <div className="w-full max-w-md p-8">
        <div className="space-y-6 text-center">
          {/* Logo / Brand */}
          <Image src="/logo.svg" alt="S.M.A.R.S" width={120} height={80} className="mx-auto" />

          <div className="space-y-2">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              S.M.A.R.S
            </h1>
            <p className="text-sm text-muted-foreground">
              Secure medical records
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button className="h-11 w-full" asChild>
              <Link href="/register">
                <UserPlusIcon className="h-4 w-4" />
                Create Account
              </Link>
            </Button>
            <Button className="h-11 w-full" asChild>
              <Link href="/login">
                <ArrowRightIcon className="h-4 w-4" />
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
