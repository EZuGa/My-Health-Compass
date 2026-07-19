import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { polishComplaint, suggestCitations, type Citation } from "@/lib/ingest.functions";
import { api } from "@/lib/api";

type CCEntry = {
  id: string;
  text: string;
  at: string; // ISO date
  source: "typed" | "voice";
  citations?: Citation[];
};


const STORAGE_KEY = "cc-entries-v1";

function loadEntries(): CCEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CCEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(rows: CCEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch {}
}

export function ChiefComplaintSection() {
  const polish = useServerFn(polishComplaint);
  const cite = useServerFn(suggestCitations);
  const [entries, setEntries] = useState<CCEntry[]>([]);

  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => setEntries(loadEntries()), []);

  const save = (next: CCEntry[]) => {
    setEntries(next);
    saveEntries(next);
  };

  const addEntry = async (value: string, source: CCEntry["source"]) => {
    const v = value.trim();
    if (!v) return;
    setBusy("Polishing into clinical prose…");
    setErr(null);
    let polished = v;
    try {
      const { text: out } = await polish({
        data: { text: v, context: "Patient-reported chief complaint" },
      });
      polished = out.trim() || v;
    } catch (e: any) {
      setErr(`Saved raw text (polish failed: ${e?.message ?? "error"})`);
    } finally {
      setBusy(null);
    }
    let citations: Citation[] = [];
    setBusy("Finding citations…");
    try {
      const { citations: cs } = await cite({ data: { text: polished, max: 3 } });
      citations = cs;
    } catch {
      // Citations are optional — never block saving.
    } finally {
      setBusy(null);
    }
    const next: CCEntry[] = [
      { id: crypto.randomUUID(), text: polished, at: new Date().toISOString(), source, citations },
      ...entries,
    ];
    save(next);
  };


  const remove = (id: string) => save(entries.filter((e) => e.id !== id));

  const submitTyped = async () => {
    const v = text;
    setText("");
    await addEntry(v, "typed");
  };

  const startRecording = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime =
        ["audio/webm", "audio/mp4"].find((t) =>
          (window as any).MediaRecorder?.isTypeSupported?.(t),
        ) ?? "";
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType });
        if (blob.size < 1024) {
          setErr("Recording was too short — try again.");
          return;
        }
        setBusy("Transcribing…");
        try {
          const { text: transcript } = await api.transcribeAudio(
            blob,
            rec.mimeType || "audio/webm",
          );
          if (transcript.trim()) {
            await addEntry(transcript, "voice");
          } else {
            setErr("No speech detected.");
          }
        } catch (e: any) {
          setErr(e?.message ?? "Transcription failed");
        } finally {
          setBusy(null);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e: any) {
      setErr(e?.message ?? "Microphone access denied");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col gap-5">
      <p className="max-w-3xl font-semibold leading-relaxed">
        The single concern that brought the patient in today, in their own words. Type it directly,
        or hold the microphone to dictate — the recording is transcribed automatically.
      </p>

      <section className="cloud-panel p-5 flex flex-col gap-3">
        <label className="text-[11px] uppercase tracking-[0.18em] font-extrabold">
          New chief complaint
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          rows={3}
          placeholder='e.g. "Chest tightness when climbing stairs for the past two weeks"'
          className="px-3 py-2 text-[15px] font-bold bg-background/40 border border-foreground/30 focus:outline-none focus:border-foreground resize-y"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={submitTyped}
            disabled={!text.trim() || !!busy}
            className="px-4 py-2 text-xs uppercase tracking-wider font-extrabold bg-[#f5cfe0] text-foreground disabled:opacity-40"
          >
            Save typed
          </button>
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={!!busy && !recording}
            className={`px-4 py-2 text-xs uppercase tracking-wider font-extrabold ${
              recording
                ? "bg-foreground text-background animate-pulse"
                : "bg-[#d9ccef] text-foreground"
            } disabled:opacity-40`}
          >
            {recording ? "■ Stop & transcribe" : "● Record voice"}
          </button>
          {busy && (
            <span className="text-xs font-bold uppercase tracking-wider opacity-70">
              {busy}
            </span>
          )}
          {err && (
            <span className="text-xs font-bold bg-red-50 text-red-700 px-2 py-1">
              {err}
            </span>
          )}
        </div>
      </section>

      <section className="cloud-panel p-5 flex flex-col gap-3">
        <h2 className="font-serif text-lg font-black border-b border-foreground/30 pb-1">
          Recorded chief complaints
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm font-semibold opacity-70">
            No chief complaint recorded yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-1 border-b border-foreground/15 pb-2 last:border-b-0"
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-extrabold opacity-70">
                  <span className="bg-[#d9ccef] text-foreground px-1.5 py-0.5">
                    {e.source === "voice" ? "Voice" : "Typed"}
                  </span>
                  <span>{new Date(e.at).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    className="ml-auto underline opacity-80 hover:opacity-100"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-[15px] font-bold leading-snug">{e.text}</p>
                {e.citations && e.citations.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase tracking-[0.18em] font-extrabold opacity-60">
                      Sources
                    </span>
                    <ol className="text-[11px] font-semibold opacity-80 list-decimal pl-4 space-y-0.5">
                      {e.citations.map((c) => (
                        <li key={c.id}>
                          <span className="font-bold">{c.name}</span>
                          <span className="opacity-60"> — {c.specialty} · {c.kind}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </li>

            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
