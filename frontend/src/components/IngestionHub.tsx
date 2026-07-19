import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { ingestData, type IngestResult } from "@/lib/ingest.functions";
import { api } from "@/lib/api";
import { invalidateObservations } from "@/lib/queries";
import { usePatientId } from "@/lib/usePatient";
import { getSectionLabel } from "@/lib/ingested";
import { DropZone } from "@/components/DropZone";
import { CameraCapture } from "@/components/CameraCapture";

const SECTION_LABEL = (id: string) => getSectionLabel(id);


const INGEST_STORE = "hp-ingested-v1";

type StoredBatch = IngestResult & { id: string; at: string };

function loadBatches(): StoredBatch[] {
  try {
    const raw = localStorage.getItem(INGEST_STORE);
    return raw ? (JSON.parse(raw) as StoredBatch[]) : [];
  } catch {
    return [];
  }
}
function saveBatches(b: StoredBatch[]) {
  try {
    localStorage.setItem(INGEST_STORE, JSON.stringify(b));
    window.dispatchEvent(new Event("hp-ingest-updated"));
  } catch {}
}


const SOURCE_KINDS = [
  { id: "voice", label: "Voice note" },
  { id: "scan-image", label: "Photo / scan" },
  { id: "scan-pdf", label: "PDF document" },
  { id: "emr-export", label: "Hospital EMR export" },
  { id: "wearable-export", label: "Wearable / app export" },
  { id: "app-screenshot", label: "App screenshot" },
  { id: "manual-text", label: "Typed note" },
  { id: "other", label: "Other" },
] as const;

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(f);
  });
}

export function IngestionHub() {
  const ingest = useServerFn(ingestData);
  const queryClient = useQueryClient();
  const patientId = usePatientId();


  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [sourceKind, setSourceKind] =
    useState<(typeof SOURCE_KINDS)[number]["id"]>("manual-text");
  const [sourceLabel, setSourceLabel] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [batches, setBatches] = useState<StoredBatch[]>([]);

  // recording
  const [recording, setRecording] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setBatches(loadBatches());
  }, []);

  function reset() {
    setText("");
    setNote("");
    setSourceLabel("");
    setFiles([]);
    setErr(null);
  }

  async function startRecording() {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType =
        ["audio/webm", "audio/mp4"].find((t) =>
          (window as any).MediaRecorder?.isTypeSupported?.(t),
        ) ?? "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        if (blob.size < 1024) {
          setErr("Recording too short — try again.");
          return;
        }
        try {
          setBusy("Transcribing voice…");
          // store:false — the Ingestion Hub extracts and saves observations
          // itself on submit; auto-store here would duplicate them.
          const { text: transcript } = await api.transcribeAudio(
            blob,
            rec.mimeType || "audio/webm",
            { store: false },
          );
          setText((prev) => (prev ? prev + "\n\n" + transcript : transcript));
          setSourceKind("voice");
        } catch (e: any) {
          setErr(e.message ?? "Transcription failed");
        } finally {
          setBusy(null);
        }
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
    } catch (e: any) {
      setErr(e.message ?? "Microphone access denied");
    }
  }

  function stopRecording() {
    recRef.current?.stop();
    setRecording(false);
  }

  async function submit() {
    setErr(null);
    if (!text.trim() && files.length === 0) {
      setErr("Add text, record a voice note, or attach a file.");
      return;
    }
    try {
      setBusy("Extracting structured data…");
      const filePayloads = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          mime: f.type || "application/octet-stream",
          dataUrl: await fileToDataUrl(f),
        })),
      );
      const result = await ingest({
        data: {
          text: text.trim() || undefined,
          note: note.trim() || undefined,
          sourceKind,
          sourceLabel: sourceLabel.trim() || undefined,
          files: filePayloads.length ? filePayloads : undefined,
        },
      });
      const batch: StoredBatch = {
        ...result,
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
      };
      const next = [batch, ...batches].slice(0, 50);
      setBatches(next);
      saveBatches(next);
      reset();
      // Persist each extracted observation to the backend so the patient's
      // record updates and doctors with a grant can see it.
      if (patientId) {
        const label = sourceLabel.trim() || result.source_kind;
        Promise.all(
          (result.observations ?? []).map((o) =>
            api.addObservation(patientId, {
              box: o.box || "general",
              metric: o.metric,
              value_text: o.value,
              value_num: Number.isFinite(Number(o.value)) ? Number(o.value) : null,
              unit: o.unit ?? null,
              observed_at: o.date
                ? o.date.length <= 10
                  ? new Date(o.date + "T00:00:00Z").toISOString()
                  : o.date
                : batch.at,
              source_kind: "document",
              source_label: label,
              note: o.note ?? null,
            }),
          ),
        )
          // Refresh the views that read observations once the writes landed.
          .then(() => invalidateObservations(queryClient, patientId))
          .catch((e) => console.warn("backend save failed", e));
      }
    } catch (e: any) {
      setErr(e.message ?? "Ingestion failed");
    } finally {
      setBusy(null);
    }
  }

  function clearAll() {
    if (!confirm("Clear all ingested batches?")) return;
    setBatches([]);
    saveBatches([]);
  }

  return (
    <section className="cloud-panel p-5">
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => setFiles((prev) => [...prev, file])}
      />
      <DropZone onFiles={(fs) => setFiles((prev) => [...prev, ...fs])}>
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <h2 className="font-serif text-2xl font-black">Ingestion Hub</h2>
        <p className="text-[11px] font-bold uppercase tracking-wider opacity-70">
          Voice · Scan · Upload from any platform / EMR / app
        </p>
      </header>
      <p className="mt-1 text-[12px] font-semibold leading-snug opacity-80 max-w-3xl">
        Drop in anything — a voice note, a photo of a lab report, a PDF discharge
        summary, a CSV export from Apple Health / Fitbit / Dexcom, a screenshot
        from any wearable app, or a typed note. You can drag &amp; drop files
        anywhere in this panel. AI extracts the measurements and routes each
        one into the right Health Passport box.
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold">
            Source type
          </span>
          <select
            value={sourceKind}
            onChange={(e) => setSourceKind(e.target.value as any)}
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
          >
            {SOURCE_KINDS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider font-extrabold">
            Source label (e.g. "Epic discharge", "Apple Health")
          </span>
          <input
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            className="bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
            placeholder="optional"
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={!!busy}
            className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold bg-[#ffc2d2]"
          >
            ● Record voice
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold bg-foreground text-background animate-pulse"
          >
            ■ Stop & transcribe
          </button>
        )}
        <label className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint)] cursor-pointer">
          + Upload files
          <input
            type="file"
            multiple
            accept="image/*,application/pdf,text/*,.csv,.json,.xml,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={(e) => {
              setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] cursor-pointer"
        >
          📷 Take photo
        </button>
        {files.length > 0 && (
          <span className="text-[11px] font-bold">
            {files.length} file{files.length > 1 ? "s" : ""} attached
          </span>
        )}
        {files.length > 0 && (
          <button
            type="button"
            onClick={() => setFiles([])}
            className="text-[11px] font-bold underline"
          >
            clear files
          </button>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste any health data here — symptoms, lab values, medication list, EMR text dump…"
        rows={5}
        className="mt-3 w-full bg-card border border-foreground/20 p-2 text-sm font-medium"
      />
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional context for the extractor (e.g. 'fasting labs from 2025-06-15')"
        className="mt-2 w-full bg-card border border-foreground/20 px-2 py-1.5 text-sm font-semibold"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          disabled={!!busy}
          onClick={submit}
          className="px-4 py-2 text-xs uppercase tracking-wider font-extrabold bg-[#f5cfe0] text-foreground disabled:opacity-50"
        >
          {busy ?? "Extract & route to boxes"}
        </button>
        {err && (
          <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1">
            {err}
          </span>
        )}
      </div>

      {batches.length > 0 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <h3 className="font-serif text-lg font-black">Ingested batches</h3>
            <button
              type="button"
              onClick={clearAll}
              className="text-[10px] font-bold underline opacity-70"
            >
              clear all
            </button>
          </div>
          <ul className="mt-2 flex flex-col gap-3">
            {batches.map((b) => (
              <li key={b.id} className="border border-foreground/20 p-3 bg-card">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold">
                    {b.source_kind} · {new Date(b.at).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold opacity-70">
                    {b.observations.length} observation
                    {b.observations.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-[12px] font-semibold leading-snug">
                  {b.summary}
                </p>
                {b.alerts?.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {b.alerts.map((a, i) => (
                      <li
                        key={i}
                        className="text-[10px] font-extrabold uppercase tracking-wider bg-[#ffc2d2] px-2 py-0.5"
                      >
                        ⚠ {a}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                  {b.observations.map((o, i) => (
                    <div
                      key={i}
                      className="text-[11px] font-semibold border-l-2 border-foreground/40 pl-2"
                    >
                      <span className="font-black uppercase tracking-wider text-[9px] bg-[color:var(--mint)] px-1">
                        {o.box}
                      </span>{" "}
                      <span className="font-black uppercase tracking-wider text-[9px] bg-[#ffc2d2] px-1">
                        {SECTION_LABEL(o.section)}
                      </span>{" "}
                      <span className="font-black">{o.metric}:</span> {o.value}
                      {o.unit ? ` ${o.unit}` : ""}
                      {o.date ? ` · ${o.date}` : ""} · {o.setting}
                      {o.note ? ` — ${o.note}` : ""}
                    </div>
                  ))}
                </div>

              </li>
            ))}
          </ul>
        </div>
      )}
      </DropZone>
    </section>
  );
}
