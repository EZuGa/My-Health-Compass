import { useRef, useState } from "react";
import { Mic, MicOff, Sparkles, AlertTriangle, Camera, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  analyzeNutrition,
  analyzeNutritionPhotos,
  type NutritionAnalysis,
} from "@/lib/nutrition.functions";
import { useLogAnalyzedNutrition } from "@/lib/nutritionEntries";
import { NutritionTrends } from "./NutritionTrends";
import { DropZone } from "@/components/DropZone";
import { CameraCapture } from "@/components/CameraCapture";

const ALARM_COLORS: Record<string, string> = {
  none: "bg-[color:var(--mint-soft)] text-foreground",
  low: "bg-yellow-100 text-yellow-900",
  moderate: "bg-orange-200 text-orange-900",
  high: "bg-red-200 text-red-900",
};

export function NutritionSection() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoNote, setPhotoNote] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<NutritionAnalysis | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const recogRef = useRef<any>(null);
  const analyze = useServerFn(analyzeNutrition);
  const analyzePhotos = useServerFn(analyzeNutritionPhotos);
  const logAnalyzed = useLogAnalyzedNutrition();

  const addPhotoFiles = (files: File[]) => {
    const remaining = Math.max(0, 8 - photos.length);
    files.slice(0, remaining).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => setPhotos((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    addPhotoFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const runPhotoAnalysis = async () => {
    if (photos.length === 0) return;
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      const res = await analyzePhotos({ data: { images: photos, note: photoNote || undefined } });
      setPhotoAnalysis(res);
      logAnalyzed.mutate({ source: "photo", analysis: res, note: photoNote || undefined });
    } catch (e: any) {
      setPhotoError(e?.message ?? "Photo analysis failed");
    } finally {
      setPhotoLoading(false);
    }
  };

  const startListening = () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      alert("Voice recognition isn't supported in this browser. Try Chrome or Edge, or type below.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let final = "";
      for (let i = 0; i < e.results.length; i++) final += e.results[i][0].transcript + " ";
      setTranscript(final.trim());
    };
    rec.onend = () => setListening(false);
    rec.start();
    recogRef.current = rec;
    setListening(true);
  };

  const stopListening = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  const runAnalysis = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyze({ data: { transcript } });
      setAnalysis(res);
      logAnalyzed.mutate({ source: "voice", analysis: res, note: transcript.slice(0, 200) });
    } catch (e: any) {
      setError(e?.message ?? "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-5 mt-5">
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => addPhotoFiles([file])}
      />
      <p className="max-w-4xl font-semibold">
        Speak naturally about everything you ate and drank today. The app transcribes your voice,
        then a clinical AI organizes it into a nutrition list with calorie and macronutrient
        estimates, and flags items that are alarming for your cardiometabolic risk profile —
        refined carbohydrates, added sugars, saturated fat, sodium, and ultra-processed foods.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 auto-rows-fr">
        {/* Voice capture box */}
        <div className="cloud-panel p-5 flex flex-col h-full">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-serif text-2xl font-black">Voice food diary</h2>
            {listening ? (
              <button
                onClick={stopListening}
                className="inline-flex items-center gap-1.5 bg-red-500 text-white font-bold px-3 py-1.5 rounded-md text-sm shadow"
              >
                <MicOff className="h-4 w-4" /> Stop
              </button>
            ) : (
              <button
                onClick={startListening}
                className="inline-flex items-center gap-1.5 bg-[color:var(--mint-deep)] font-bold px-3 py-1.5 rounded-md text-sm shadow"
              >
                <Mic className="h-4 w-4" /> Record
              </button>
            )}
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            placeholder="Tap Record and describe your meals — e.g. 'for breakfast I had two slices of white toast with butter and jam, a glass of orange juice, and a cappuccino with sugar…'"
            className="w-full flex-1 bg-background/60 p-3 rounded-md font-serif text-base resize-none border border-foreground/15 focus:outline-none focus:ring-2 focus:ring-[color:var(--mint-deep)]"
          />
          {listening && (
            <div className="mt-2 text-xs flex items-center gap-2 font-bold">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Listening…
            </div>
          )}
          <button
            onClick={runAnalysis}
            disabled={!transcript.trim() || loading}
            className="mt-3 inline-flex items-center justify-center gap-2 bg-[color:var(--mint)] hover:bg-[color:var(--mint-deep)] font-extrabold uppercase tracking-[0.18em] text-xs py-2.5 rounded-md shadow disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {loading ? "Analyzing…" : "Analyze nutrition"}
          </button>
          {error && <p className="mt-2 text-xs font-bold text-red-700">{error}</p>}
        </div>

        <ResultsPanel title="Organized nutrition list (voice)" analysis={analysis} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 auto-rows-fr">
        {/* Photo food diary box */}
        <div className="cloud-panel p-5 flex flex-col h-full">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-serif text-2xl font-black">Photo food diary</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="inline-flex items-center gap-1.5 bg-[color:var(--mint-deep)] font-bold px-3 py-1.5 rounded-md text-sm shadow cursor-pointer"
              >
                <Camera className="h-4 w-4" /> Take photo
              </button>
              <label className="inline-flex items-center gap-1.5 bg-[color:var(--mint)] font-bold px-3 py-1.5 rounded-md text-sm shadow cursor-pointer">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
            </div>
          </div>

          <DropZone
            onFiles={addPhotoFiles}
            accept={(f) => f.type.startsWith("image/")}
            className="flex-1 flex flex-col"
          >
            {photos.length === 0 ? (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-foreground/25 rounded-md text-sm font-bold opacity-70 px-4 text-center">
                Snap, upload, or drag &amp; drop pictures of your meals — breakfast, lunch, dinner,
                snacks. AI will identify each food, estimate portions, and calculate calories &amp;
                macros.
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto pr-1">
                {photos.map((src, i) => (
                  <figure key={i} className="relative group rounded-md overflow-hidden border border-foreground/15">
                    <img src={src} alt={`Meal ${i + 1}`} className="w-full h-24 object-cover" />
                    <button
                      onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5"
                      aria-label="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </DropZone>

          <input
            type="text"
            value={photoNote}
            onChange={(e) => setPhotoNote(e.target.value)}
            placeholder="Optional context — e.g. 'breakfast at home, lunch at restaurant'"
            className="mt-3 w-full bg-background/60 px-3 py-2 rounded-md text-sm font-semibold border border-foreground/15 focus:outline-none focus:ring-2 focus:ring-[color:var(--mint-deep)]"
          />

          <button
            onClick={runPhotoAnalysis}
            disabled={photos.length === 0 || photoLoading}
            className="mt-3 inline-flex items-center justify-center gap-2 bg-[color:var(--mint)] hover:bg-[color:var(--mint-deep)] font-extrabold uppercase tracking-[0.18em] text-xs py-2.5 rounded-md shadow disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {photoLoading ? "Analyzing photos…" : `Analyze ${photos.length || ""} meal photo${photos.length === 1 ? "" : "s"}`}
          </button>
          {photoError && <p className="mt-2 text-xs font-bold text-red-700">{photoError}</p>}
        </div>

        <ResultsPanel title="Organized nutrition list (photos)" analysis={photoAnalysis} />
      </div>

      <NutritionTrends />
    </div>
  );
}

function ResultsPanel({ title, analysis }: { title: string; analysis: NutritionAnalysis | null }) {
  return (
    <div className="cloud-panel p-5 flex flex-col h-full overflow-hidden">
      <h2 className="font-serif text-2xl font-black mb-3">{title}</h2>
      {!analysis && (
        <p className="text-sm opacity-70 font-semibold">
          The structured food list, macronutrient estimates, and clinical alarms will appear here
          after analysis.
        </p>
      )}
      {analysis && (
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
          {analysis.alerts?.length > 0 && (
            <div className="rounded-md bg-red-50 border border-red-300 p-3">
              <div className="flex items-center gap-2 font-extrabold text-sm text-red-800 mb-1">
                <AlertTriangle className="h-4 w-4" /> Clinical alerts
              </div>
              <ul className="list-disc pl-5 text-sm font-semibold text-red-900 space-y-0.5">
                {analysis.alerts.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          <ul className="space-y-2">
            {analysis.items.map((it, i) => (
              <li
                key={i}
                className={`rounded-md px-3 py-2 ${ALARM_COLORS[it.alarm] ?? ALARM_COLORS.none}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-extrabold text-sm">
                    {it.food} <span className="font-semibold opacity-80">— {it.amount}</span>
                  </div>
                  <div className="text-xs font-extrabold whitespace-nowrap">
                    ~{Math.round(it.calories)} kcal
                  </div>
                </div>
                <div className="text-[11px] font-bold opacity-90 mt-0.5">
                  carbs {it.carbs_g}g · sugar {it.sugar_g}g · sat-fat {it.sat_fat_g}g · Na {it.sodium_mg}mg · {it.category}
                </div>
                {it.alarm !== "none" && it.alarm_reason && (
                  <div className="text-[11px] font-extrabold mt-1 uppercase tracking-wide">
                    ⚠ {it.alarm} risk — {it.alarm_reason}
                  </div>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-2 rounded-md bg-[color:var(--mint-soft)] p-3">
            <div className="text-[11px] uppercase tracking-[0.18em] font-extrabold mb-1">
              Daily totals
            </div>
            <div className="text-sm font-bold">
              {Math.round(analysis.totals.calories)} kcal · {analysis.totals.carbs_g}g carbs ·{" "}
              {analysis.totals.sugar_g}g sugar · {analysis.totals.sat_fat_g}g sat-fat ·{" "}
              {analysis.totals.sodium_mg}mg sodium
            </div>
            {analysis.summary && (
              <p className="text-sm font-semibold mt-2 leading-snug">{analysis.summary}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
