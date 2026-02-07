import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

interface NavLink {
  href: string;
  label: string;
}

interface DashboardShellProps {
  user: { FirstName: string; LastName: string; Role: string };
  navLinks: NavLink[];
  children: React.ReactNode;
}

const roleBadgeColors: Record<string, string> = {
  patient:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  doctor:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  admin:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function DashboardShell({
  user,
  navLinks,
  children,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-black font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 flex flex-col">
        <div className="mb-10 flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-black font-bold italic">
            S
          </div>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            S.M.A.R.S
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {user.FirstName} {user.LastName}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${roleBadgeColors[user.Role] || ""}`}
            >
              {user.Role}
            </span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
