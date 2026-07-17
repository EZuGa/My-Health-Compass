import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Panel, Pill, ErrorNote, Empty, useAsync, fmtDateTime } from "@/components/backend/ui";
import { api, type Observation } from "@/lib/api";
import { usePatientId } from "@/lib/usePatient";

export const Route = createFileRoute("/_authenticated/intake")({
  head: () => ({ meta: [{ title: "AI Intake — Zrunva" }] }),
  component: IntakePage,
});

const EXAMPLES = [
  "I have 50 pulse and pressure 100 over 70",
  "temperature 37.8, weight 82 kg today",
  "blood glucose 7.4, feeling tired",
];

function IntakePage() {
  const patientId = usePatientId();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [lastParsedBy, setLastParsedBy] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const recent = useAsync<Observation[]>(
    () =>
      patientId ? api.listObservations(patientId, { source_kind: "chat" }) : Promise.resolve([]),
    [patientId, reloadKey],
  );

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.intakeMessage(message.trim());
      setLastParsedBy(res.parsed_by);
      setMessage("");
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <section className="max-w-3xl w-full">
        <h1 className="font-serif text-3xl font-black">AI Intake</h1>
        <p className="mt-1 text-sm font-semibold opacity-70">
          Tell the app how you feel in plain language. It extracts structured, timestamped vitals
          and stores them on your record via <code className="text-[12px]">/intake/message</code>.
        </p>
      </section>

      <div className="max-w-3xl w-full flex flex-col gap-5">
        <Panel>
          <form onSubmit={send} className="flex flex-col gap-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="e.g. I have 50 pulse and pressure 100 over 70"
              className="w-full bg-card border border-foreground/20 p-2 text-sm font-medium"
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setMessage(ex)}
                  className="text-[11px] font-bold px-2 py-1 border border-foreground/25 rounded hover:bg-[color:var(--mint-soft)]"
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 text-xs uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
              >
                {busy ? "Parsing…" : "Send"}
              </button>
              {lastParsedBy && (
                <span className="text-[11px] font-bold opacity-70">
                  parsed by <Pill tone="mint">{lastParsedBy}</Pill>
                </span>
              )}
            </div>
            <ErrorNote error={error} />
          </form>
        </Panel>

        <Panel title="Recent chat-logged vitals" subtitle="source_kind = chat">
          <ErrorNote error={recent.error} />
          {recent.loading && !recent.data ? (
            <Empty>Loading…</Empty>
          ) : !recent.data || recent.data.length === 0 ? (
            <Empty>Nothing logged via chat yet. Send a message above.</Empty>
          ) : (
            <ul className="flex flex-col gap-1">
              {[...recent.data]
                .sort((a, b) => b.observed_at.localeCompare(a.observed_at))
                .map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between border border-foreground/15 bg-card px-3 py-2 rounded-md"
                  >
                    <div>
                      <span className="font-bold">{o.metric.replace(/_/g, " ")}</span>:{" "}
                      {o.value_num ?? o.value_text}
                      {o.unit ? ` ${o.unit}` : ""}
                    </div>
                    <span className="text-[10px] opacity-50">{fmtDateTime(o.observed_at)}</span>
                  </li>
                ))}
            </ul>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
