// Small shared building blocks for the backend-driven pages (Health Records,
// Clinician Console, AI Intake). Kept intentionally lightweight and on-brand
// with the existing cloud-panel / mint styling.
import { useCallback, type ReactNode } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

export function Panel({
  title,
  subtitle,
  right,
  children,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="cloud-panel p-5">
      {(title || right) && (
        <header className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <div>
            {title && <h2 className="font-serif text-xl font-black">{title}</h2>}
            {subtitle && <p className="text-[12px] font-semibold opacity-70">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border border-foreground/15 bg-card px-3 py-2 rounded-md">
      <div className="text-2xl font-black leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-extrabold opacity-60 mt-1">
        {label}
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "mint",
}: {
  children: ReactNode;
  tone?: "mint" | "pink" | "amber" | "gray";
}) {
  const bg: Record<string, string> = {
    mint: "var(--mint)",
    pink: "#ffc2d2",
    amber: "#fff4c2",
    gray: "#e5e5e5",
  };
  return (
    <span
      className="inline-block text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded"
      style={{ background: bg[tone] }}
    >
      {children}
    </span>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null;
  const msg =
    error instanceof ApiError
      ? error.status === 0
        ? "Can't reach the backend. Start it: cd backend && uvicorn app.main:app --port 8000"
        : error.message
      : error instanceof Error
        ? error.message
        : String(error);
  return (
    <div className="text-sm font-bold text-red-700 border border-red-700 bg-red-50 p-2 rounded">
      {msg}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="text-sm font-semibold opacity-70 border border-dashed border-foreground/25 rounded-md p-4">
      {children}
    </div>
  );
}

/** Data hook backed by React Query: one request + one cache entry per
 * `queryKey` (see `lib/queries.ts` — components asking for the same key share
 * both). Cached data is reused across pages within the stale time; `reload()`
 * invalidates the key and refetches. */
export function useAsync<T>(
  queryKey: readonly unknown[],
  loader: () => Promise<T>,
  options?: { staleTime?: number; enabled?: boolean },
): { data: T | null; loading: boolean; error: unknown; reload: () => void } {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: loader,
    // Only override the QueryClient defaults when a value is actually given:
    // passing `staleTime: undefined` would ERASE the default staleTime and
    // make the query refetch on every mount (React Query spreads options over
    // defaults verbatim).
    ...(options?.staleTime !== undefined ? { staleTime: options.staleTime } : {}),
    ...(options?.enabled !== undefined ? { enabled: options.enabled } : {}),
    // Keep showing the previous key's data while the new one loads.
    placeholderData: keepPreviousData,
  });
  const reload = useCallback(
    () => void queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey],
  );
  return {
    data: query.data ?? null,
    // Not "loading" when the query is merely disabled (fetchStatus "idle").
    loading: (query.isPending && query.fetchStatus !== "idle") || query.isPlaceholderData,
    error: query.error,
    reload,
  };
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
