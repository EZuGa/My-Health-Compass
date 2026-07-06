// Small shared building blocks for the backend-driven pages (Health Records,
// Clinician Console, AI Intake). Kept intentionally lightweight and on-brand
// with the existing cloud-panel / mint styling.
import { useCallback, useEffect, useState, type ReactNode } from "react";
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
            {subtitle && (
              <p className="text-[12px] font-semibold opacity-70">{subtitle}</p>
            )}
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

/** Minimal data hook: runs an async loader, tracks loading/error, and exposes reload(). */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): { data: T | null; loading: boolean; error: unknown; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loader()
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, reload };
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
