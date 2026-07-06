import { useEffect, useState } from "react";
import { MessageSquareText, RefreshCw, Trash2 } from "lucide-react";
import {
  loadDiscussionItems,
  regenerateFromToxins,
  clearDiscussionItems,
  type DiscussionItem,
} from "@/lib/crossLinks";

export function DiscussionItemsBox() {
  const [items, setItems] = useState<DiscussionItem[]>([]);

  useEffect(() => {
    setItems(loadDiscussionItems());
    const refresh = () => setItems(loadDiscussionItems());
    window.addEventListener("discussion:updated", refresh);
    window.addEventListener("toxins:updated", refresh);
    return () => {
      window.removeEventListener("discussion:updated", refresh);
      window.removeEventListener("toxins:updated", refresh);
    };
  }, []);

  const regen = () => setItems(regenerateFromToxins());
  const clear = () => {
    clearDiscussionItems();
    setItems([]);
  };

  return (
    <section
      className="mt-6 rounded-xl p-5 flex flex-col gap-4"
      style={{
        background: "linear-gradient(160deg, #ece3ff 0%, #c9b8ee 100%)",
        color: "#3a2a55",
        border: "1px solid rgba(58,42,85,0.25)",
      }}
    >
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <MessageSquareText className="w-6 h-6" strokeWidth={2.5} />
          <div>
            <h2 className="font-serif text-2xl font-black">Items to discuss with your clinician</h2>
            <p className="text-xs font-semibold opacity-80 max-w-2xl">
              Automatically surfaced from your saved exposures. These are
              <span className="font-extrabold"> information only</span> — not a
              diagnosis, medical advice, or screening recommendation. Use them
              as talking points at your next visit.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={regen}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-extrabold rounded-md text-white"
            style={{ background: "#3a2a55" }}
          >
            <RefreshCw className="w-3 h-3" /> Refresh from toxins
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-extrabold rounded-md border"
              style={{ borderColor: "#3a2a55", color: "#3a2a55" }}
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </header>

      {items.length === 0 ? (
        <div className="cloud-panel p-4 rounded-lg text-sm font-semibold">
          No discussion items yet. Save ToxCheck findings to your exposures and
          press <span className="font-extrabold">Refresh from toxins</span>.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="cloud-panel rounded-lg p-3 flex flex-col gap-1.5"
              style={{ borderLeft: "4px solid #3a2a55" }}
            >
              <div className="font-serif text-base font-black">{it.topic}</div>
              <p className="text-sm font-semibold leading-snug">{it.rationale}</p>
              <div className="text-xs font-bold opacity-80">
                Triggered by <span className="font-extrabold">{it.trigger}</span>
                {it.source ? <> · from {it.source}</> : null}
              </div>
              <div className="text-[11px] font-medium opacity-75 leading-snug">
                <span className="uppercase tracking-wider font-extrabold opacity-70">Basis:</span>{" "}
                {it.basis}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
