import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { medications, appointments, reminders } from "@/data/health";

type Tab = "all" | "medications" | "appointments" | "reminders";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — The Health Passport" }] }),
  component: CalendarPage,
});

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(() => ymd(new Date()));
  const [tab, setTab] = useState<Tab>("all");

  const monthGrid = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const dayEvents = (dateStr: string) => {
    const meds = medications
      .filter((m) => m.since <= dateStr)
      .flatMap((m) => m.times.map((t) => ({ kind: "medication" as const, time: t, label: m.name })));
    const appts = appointments
      .filter((a) => a.date === dateStr)
      .map((a) => ({ kind: "appointment" as const, time: a.time, label: a.title }));
    const rems = reminders
      .filter((r) => r.date === dateStr)
      .map((r) => ({ kind: "reminder" as const, time: "—", label: r.title }));
    let all = [...meds, ...appts, ...rems];
    if (tab !== "all") all = all.filter((e) => e.kind === tab.slice(0, -1));
    return all.sort((a, b) => a.time.localeCompare(b.time));
  };

  const selectedEvents = dayEvents(selected);

  const dayHasEvent = (d: Date) => dayEvents(ymd(d)).length > 0;

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-auto">
      <header className="border-b border-foreground/40 px-6 py-3 flex items-center justify-between">
        <div className="font-serif text-xl">Daily Schedule</div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 border border-foreground px-3 py-1.5 rounded-sm text-sm bg-card"
        >
          <X className="h-4 w-4" /> Close
        </Link>
      </header>

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-2">
        {(["all", "medications", "appointments", "reminders"] as Tab[]).map((t) => {
          const tabTone: Record<Exclude<Tab, "all">, { bg: string; border: string }> = {
            medications: { bg: "#f6d4dc", border: "#e9b8c4" },
            appointments: { bg: "#f4cad4", border: "#e3aebd" },
            reminders: { bg: "#f8dde3", border: "#edc1cd" },
          };
          const isActive = tab === t;
          if (t === "all") {
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs uppercase tracking-[0.18em] border border-foreground px-3 py-1.5 rounded-sm ${
                  isActive ? "bg-foreground text-mint" : "bg-card"
                }`}
              >
                {t}
              </button>
            );
          }
          const tone = tabTone[t];
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                backgroundColor: isActive ? tone.border : tone.bg,
                borderColor: tone.border,
              }}
              className="text-xs uppercase tracking-[0.18em] border px-3 py-1.5 rounded-sm text-foreground"
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 px-6 py-6">
        {/* Month grid */}
        <div className="border border-foreground bg-card rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="border border-foreground p-1.5 rounded-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-serif text-lg">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </div>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="border border-foreground p-1.5 rounded-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[11px] uppercase tracking-widest opacity-70 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;
              const dateStr = ymd(d);
              const isSelected = dateStr === selected;
              const hasEvt = dayHasEvent(d);
              return (
                <button
                  key={i}
                  onClick={() => setSelected(dateStr)}
                  style={
                    isSelected
                      ? undefined
                      : { backgroundColor: "color-mix(in oklab, var(--mint) 55%, white 45%)" }
                  }
                  className={`aspect-square border rounded-sm p-1 text-left flex flex-col justify-between ${
                    isSelected
                      ? "border-foreground bg-mint-deep"
                      : "border-foreground/30 hover:border-foreground"
                  }`}
                >
                  <span className="text-sm">{d.getDate()}</span>
                  {hasEvt && <span className="self-end h-1.5 w-1.5 rounded-full bg-foreground" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <aside className="border border-foreground bg-card rounded-md p-4">
          <div className="font-serif text-lg mb-1">
            {new Date(selected).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] opacity-70 mb-3">
            {tab === "all" ? "All items" : tab}
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm opacity-70">Nothing scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((e, i) => {
                // Muted flamingo pink palette — calming, not bright
                const tone =
                  e.kind === "medication"
                    ? { bg: "#f6d4dc", border: "#e9b8c4" } // soft flamingo
                    : e.kind === "appointment"
                    ? { bg: "#f4cad4", border: "#e3aebd" } // slightly deeper flamingo
                    : { bg: "#f8dde3", border: "#edc1cd" }; // palest flamingo
                return (
                  <li
                    key={i}
                    className="border rounded-sm p-3 flex items-baseline gap-3"
                    style={{ backgroundColor: tone.bg, borderColor: tone.border }}
                  >
                    <span className="font-mono text-sm w-14 shrink-0">{e.time}</span>
                    <div>
                      <div className="text-sm font-semibold">{e.label}</div>
                      <div className="text-[11px] uppercase tracking-[0.18em] opacity-60">{e.kind}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
