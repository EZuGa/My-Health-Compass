import { useIngestedObservations, getSectionLabel } from "@/lib/ingested";

export function IngestedSectionPanel({ sectionId }: { sectionId: string }) {
  const items = useIngestedObservations(sectionId);
  if (items.length === 0) return null;
  return (
    <section className="mt-6 cloud-panel p-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-serif text-xl font-black">
          Ingested into {getSectionLabel(sectionId)}
        </h2>
        <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-70">
          {items.length} observation{items.length === 1 ? "" : "s"} from voice / scans / connected apps
        </span>
      </header>
      <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {items
          .slice()
          .sort((a, b) => (b.at > a.at ? 1 : -1))
          .map((o, i) => (
            <li
              key={o.batchId + i}
              className="text-[12px] font-semibold border-l-2 border-foreground/40 pl-2"
            >
              <span className="font-black uppercase tracking-wider text-[9px] bg-[color:var(--mint)] px-1">
                {o.box}
              </span>{" "}
              <span className="font-black">{o.metric}:</span> {o.value}
              {o.unit ? ` ${o.unit}` : ""}
              {o.date ? ` · ${o.date}` : ""} · {o.setting}
              {o.source ? ` · ${o.source}` : ""}
              {o.note ? ` — ${o.note}` : ""}
            </li>
          ))}
      </ul>
    </section>
  );
}
