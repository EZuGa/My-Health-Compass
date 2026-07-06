import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Maximize2 } from "lucide-react";
import { medications, appointments, reminders } from "@/data/health";

function todayItems() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    meds: medications.flatMap((m) => m.times.map((t) => ({ time: t, name: m.name }))),
    appts: appointments.filter((a) => a.date === today),
    rems: reminders.filter((r) => r.date === today),
  };
}

export function CalendarWidget() {
  const [hovered, setHovered] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  useEffect(() => {
    setDate(new Date());
  }, []);
  const { meds, appts, rems } = todayItems();

  return (
    <Link
      to="/calendar"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block rounded-md p-[2px] bg-[linear-gradient(135deg,#ffc2d2_0%,#e8d5b0_50%,#b8d8b0_100%)] shadow-[0_6px_18px_-6px_rgba(244,184,200,0.55),0_8px_22px_-10px_rgba(184,216,176,0.55)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-transform"
    >
      <div className="bg-card rounded-[5px] p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="text-xs uppercase tracking-widest">Today</span>
          </div>
          <Maximize2 className={`h-3.5 w-3.5 ${hovered ? "opacity-100" : "opacity-50"}`} />
        </div>
        <div className="mt-2" suppressHydrationWarning>
          <div
            className="text-3xl leading-none font-semibold"
            style={{ color: "#d97a92" }}
          >
            {date ? date.getDate() : "—"}
          </div>
          <div className="text-xs" style={{ color: "#4b2e83" }}>
            {date
              ? date.toLocaleDateString(undefined, { weekday: "long", month: "long", year: "numeric" })
              : "\u00a0"}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 text-[10px] gap-1 border-t border-foreground/10 pt-2">
          <div><div className="font-semibold">Meds</div><div>{meds.length}</div></div>
          <div><div className="font-semibold">Appts</div><div>{appts.length}</div></div>
          <div><div className="font-semibold">Reminders</div><div>{rems.length}</div></div>
        </div>
      </div>
    </Link>

  );
}
