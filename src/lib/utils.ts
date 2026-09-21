import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a post's "YYYY-MM-DD" date for display.
 *
 * Passing that string to `new Date` is not safe here: the spec parses a
 * date-only ISO string as UTC midnight, so `toLocaleDateString` renders the
 * previous day for every visitor west of UTC - a post dated 2026-09-20 read
 * "September 19, 2026" in US Eastern. Handing the parts to the constructor
 * individually selects its local-time overload, so the date reads as written
 * in every timezone.
 */
export function formatPostDate(date: string, month: "long" | "short" = "long"): string {
  const [year, monthIndex, day] = date.split("-").map(Number);

  return new Date(year, monthIndex - 1, day).toLocaleDateString("en-US", {
    month,
    day: "numeric",
    year: "numeric",
  });
}
