import { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ReferenceArea,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import {
  useNutritionEntries,
  useLogManualCalories,
  useDeleteNutritionEntry,
  type NutritionEntry,
  type EntrySource,
} from "@/lib/nutritionEntries";

// Personalized calorie targets for Mrs. Z (47F, dyslipidemia, HTN, ASCVD risk)
const CAL = { min: 1500, max: 1800, target: 1650 };

const SOURCES: EntrySource[] = ["manual", "photo", "voice", "import", "other"];

const SOURCE_COLORS: Record<EntrySource, string> = {
  manual: "#3d7a5a",
  photo: "#c8324a",
  voice: "#7a4b8f",
  import: "#e8b04b",
  other: "#888",
};

type Granularity = "daily" | "monthly" | "annual";

export function NutritionTrends() {
  const { data: entries = [], isLoading } = useNutritionEntries();
  const logManual = useLogManualCalories();
  const removeEntry = useDeleteNutritionEntry();

  const [tab, setTab] = useState<Granularity>("daily");

  // Manual entry form
  const [calories, setCalories] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<EntrySource>("manual");
  const [note, setNote] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(calories);
    if (!Number.isFinite(n) || n <= 0) return;
    await logManual.mutateAsync({
      calories: n,
      // Anchor to noon so day boundaries are stable across timezones
      occurredAt: new Date(date + "T12:00:00").toISOString(),
      note: note || undefined,
      source,
    });
    setCalories("");
    setNote("");
  };

  return (
    <div className="cloud-panel p-5 flex flex-col h-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="font-serif text-2xl font-black">Nutrition trends</h2>
        <span className="text-xs font-bold opacity-70">
          {entries.length} entr{entries.length === 1 ? "y" : "ies"} stored
        </span>
      </div>

      {/* Manual / multi-source entry */}
      <form
        onSubmit={submit}
        className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4 p-3 rounded-md bg-background/60 border border-foreground/10"
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="col-span-2 sm:col-span-2 px-2 py-1.5 rounded text-sm font-bold bg-background border border-foreground/15"
        />
        <input
          type="number"
          min={0}
          step={1}
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="kcal"
          className="col-span-1 px-2 py-1.5 rounded text-sm font-bold bg-background border border-foreground/15"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as EntrySource)}
          className="col-span-1 px-2 py-1.5 rounded text-sm font-bold bg-background border border-foreground/15"
        >
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="note (optional)"
          className="col-span-2 sm:col-span-1 px-2 py-1.5 rounded text-sm font-bold bg-background border border-foreground/15"
        />
        <button
          type="submit"
          disabled={logManual.isPending || !calories}
          className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1 bg-[color:var(--mint)] hover:bg-[color:var(--mint-deep)] font-extrabold uppercase tracking-wider text-[11px] py-1.5 rounded shadow disabled:opacity-50"
        >
          <Plus className="h-3 w-3" /> Log
        </button>
      </form>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-sm font-bold opacity-70">
          Loading entries…
        </div>
      ) : entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm font-bold opacity-70 px-4 text-center border-2 border-dashed border-foreground/25 rounded-md">
          No nutrition data yet. Log a calorie entry above, or analyze a voice / photo diary —
          everything saved here turns into daily, monthly, and annual trends.
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as Granularity)} className="flex-1 flex flex-col">
          <TabsList className="self-start mb-2">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">Annual</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="flex-1 flex flex-col gap-3 mt-0">
            <TrendChart entries={entries} granularity="daily" />
            <RecentList entries={entries} onDelete={(id) => removeEntry.mutate(id)} />
          </TabsContent>
          <TabsContent value="monthly" className="flex-1 mt-0">
            <TrendChart entries={entries} granularity="monthly" />
          </TabsContent>
          <TabsContent value="annual" className="flex-1 mt-0">
            <TrendChart entries={entries} granularity="annual" />
          </TabsContent>
        </Tabs>
      )}

      <p className="text-[11px] font-bold opacity-70 leading-snug mt-3">
        Target band {CAL.min}–{CAL.max} kcal/day (Mediterranean / DASH for dyslipidemia + HTN).
        Daily values sum every entry that day; monthly &amp; annual show average kcal/day.
      </p>
    </div>
  );
}

function bucketKey(iso: string, g: Granularity): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (g === "daily") return `${yyyy}-${mm}-${dd}`;
  if (g === "monthly") return `${yyyy}-${mm}`;
  return `${yyyy}`;
}

function TrendChart({
  entries,
  granularity,
}: {
  entries: NutritionEntry[];
  granularity: Granularity;
}) {
  const data = useMemo(() => {
    // For monthly/annual we average kcal/day across the period.
    const byBucket = new Map<
      string,
      { key: string; total: number; days: Set<string>; bySource: Record<string, number> }
    >();
    for (const e of entries) {
      const key = bucketKey(e.occurred_at, granularity);
      const day = bucketKey(e.occurred_at, "daily");
      const slot =
        byBucket.get(key) ??
        { key, total: 0, days: new Set<string>(), bySource: {} };
      slot.total += Number(e.calories) || 0;
      slot.days.add(day);
      slot.bySource[e.source] = (slot.bySource[e.source] ?? 0) + (Number(e.calories) || 0);
      byBucket.set(key, slot);
    }
    return Array.from(byBucket.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((s) => ({
        key: s.key,
        label:
          granularity === "daily"
            ? s.key.slice(5)
            : granularity === "monthly"
              ? s.key
              : s.key,
        calories:
          granularity === "daily"
            ? Math.round(s.total)
            : Math.round(s.total / Math.max(1, s.days.size)),
        manual: Math.round(s.bySource.manual ?? 0),
        photo: Math.round(s.bySource.photo ?? 0),
        voice: Math.round(s.bySource.voice ?? 0),
        import: Math.round(s.bySource.import ?? 0),
        other: Math.round(s.bySource.other ?? 0),
      }));
  }, [entries, granularity]);

  const yLabel =
    granularity === "daily" ? "kcal / day" : "avg kcal / day";

  return (
    <div className="h-64">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] mb-1">
        {granularity === "daily"
          ? "Daily calories"
          : granularity === "monthly"
            ? "Monthly average calories per day"
            : "Annual average calories per day"}
        <span className="ml-2 opacity-60">({yLabel})</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        {granularity === "daily" ? (
          <LineChart data={data} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700 }} />
            <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                border: "1px solid hsl(0 0% 0% / 0.15)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
              }}
            />
            <ReferenceArea
              y1={CAL.min}
              y2={CAL.max}
              fill="#7ec8a4"
              fillOpacity={0.18}
              stroke="#7ec8a4"
              strokeOpacity={0.35}
              ifOverflow="extendDomain"
            />
            <ReferenceLine y={CAL.target} stroke="#3d7a5a" strokeDasharray="4 4" strokeOpacity={0.7} />
            <Line type="monotone" dataKey="calories" stroke="#c8324a" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 700 }} />
            <YAxis tick={{ fontSize: 11, fontWeight: 700 }} />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                border: "1px solid hsl(0 0% 0% / 0.15)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
              }}
            />
            <ReferenceLine
              y={CAL.target}
              stroke="#3d7a5a"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{ value: `target ${CAL.target}`, position: "insideTopRight", fontSize: 10, fontWeight: 800, fill: "#3d7a5a" }}
            />
            <Bar dataKey="calories" fill="#c8324a" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function RecentList({
  entries,
  onDelete,
}: {
  entries: NutritionEntry[];
  onDelete: (id: string) => void;
}) {
  const recent = [...entries].reverse().slice(0, 12);
  return (
    <div className="border-t border-foreground/15 pt-2">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] mb-1">
        Recent entries
      </div>
      <ul className="text-xs font-semibold max-h-40 overflow-y-auto divide-y divide-foreground/10">
        {recent.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2 py-1">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: SOURCE_COLORS[e.source] }}
              />
              <span className="font-bold">{new Date(e.occurred_at).toLocaleDateString()}</span>
              <span className="opacity-70">{e.source}</span>
              {e.note && <span className="opacity-70 italic">— {e.note}</span>}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-extrabold">{Math.round(e.calories)} kcal</span>
              <button
                onClick={() => onDelete(e.id)}
                aria-label="Delete entry"
                className="opacity-50 hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
