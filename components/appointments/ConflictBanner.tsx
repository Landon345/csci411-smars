import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ConflictBannerProps {
  count: number;
}

export function ConflictBanner({ count }: ConflictBannerProps) {
  if (count === 0) return null;

  return (
    <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
      <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
      <span>
        <span className="font-medium">
          {count} conflicting appointment{count !== 1 ? "s" : ""}
        </span>{" "}
        in this month. Conflicts are highlighted with a red border.
      </span>
    </div>
  );
}
