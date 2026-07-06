import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, ScanBarcode, X, FlaskConical } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { CameraCapture } from "@/components/CameraCapture";
import { analyzeToxins, type ToxAnalysis, type ToxSeverity } from "@/lib/toxcheck.functions";
import { appendToxins } from "@/components/ToxinsBox";
import { Link } from "@tanstack/react-router";

const SEV_STYLE: Record<ToxSeverity, { bg: string; fg: string; label: string }> = {
  critical: { bg: "#7a1c2e", fg: "#fff", label: "Critical" },
  high: { bg: "#b8243a", fg: "#fff", label: "High" },
  moderate: { bg: "#ffc2d2", fg: "#5a1a2e", label: "Moderate" },
  low: { bg: "#ece3ff", fg: "#3a2a55", label: "Low" },
};

function SeverityBadge({ s }: { s: ToxSeverity }) {
  const sev = SEV_STYLE[s];
  const danger = s === "critical" || s === "high";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-[0.18em] font-extrabold rounded-md"
      style={{ background: sev.bg, color: sev.fg }}
    >
      {danger && (
        <AlertTriangle className="w-3 h-3" strokeWidth={3} />
      )}
      {sev.label}
    </span>
  );
}

export function ToxCheckSection() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [barcode, setBarcode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ToxAnalysis | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const analyze = useServerFn(analyzeToxins);

  const saveToExposures = async () => {
    if (!analysis) return;
    const flat = (analysis.products ?? []).flatMap((p) =>
      (p.substances ?? []).map((s) => ({
        name: s.name,
        source: p.name,
        severity: s.severity,
        category: s.category as any,
        notes: [s.health_effects, s.patient_specific_risk].filter(Boolean).join(" — "),
      })),
    );
    if (!flat.length) return;
    const added = appendToxins(flat);
    setSavedCount(added);
    setTimeout(() => setSavedCount(null), 4000);
  };


  const addFiles = (files: File[]) => {
    const remaining = Math.max(0, 8 - photos.length);
    files.slice(0, remaining).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => setPhotos((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const run = async () => {
    if (!photos.length && !text.trim() && !barcode.trim()) {
      setError("Add a photo, description, or barcode first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await analyze({
        data: {
          images: photos.length ? photos : undefined,
          text: text.trim() || undefined,
          barcode: barcode.trim() || undefined,
        },
      });
      setAnalysis(res);
    } catch (e: any) {
      setError(e?.message ?? "ToxCheck failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhotos([]);
    setText("");
    setBarcode("");
    setAnalysis(null);
    setError(null);
  };

  return (
    <section className="flex-1 flex flex-col gap-6">
      {/* Input panel — burgundy/pink theme outside, mint inside */}
      <div
        className="rounded-xl p-6 flex flex-col gap-5 shadow-[0_4px_18px_-6px_rgba(120,20,50,0.35)]"
        style={{
          background: "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 55%, #d99bb0 100%)",
          color: "#4a0f22",
          border: "1px solid rgba(122,28,46,0.35)",
        }}
      >
        <div className="flex items-center gap-3">
          <FlaskConical className="w-7 h-7" strokeWidth={2.5} style={{ color: "#7a1c2e" }} />
          <div>
            <h2 className="font-serif text-2xl font-black" style={{ color: "#5a0f22" }}>
              ToxCheck Workbench
            </h2>
            <p className="text-xs font-semibold opacity-80">
              Snap a product, scan a barcode, draw or describe a label — we'll cross-check it
              against IARC, EFSA, FDA, ECHA, Prop 65 and your medical record.
            </p>
          </div>
        </div>

        {/* Photos / drop zone — mint */}
        <DropZone onFiles={addFiles} className="cloud-panel p-4 rounded-lg" >
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] uppercase tracking-[0.18em] font-extrabold" style={{ color: "#163019" }}>
              Photos · labels · drawings ({photos.length}/8)
            </div>
            <div className="flex gap-2">
              <label
                className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-extrabold rounded-md border"
                style={{ borderColor: "#7a1c2e", color: "#7a1c2e" }}
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(Array.from(e.target.files ?? []));
                    e.target.value = "";
                  }}
                />
                Upload
              </label>
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-extrabold rounded-md text-white"
                style={{ background: "#7a1c2e" }}
              >
                <Camera className="w-3 h-3" /> Camera
              </button>
            </div>
          </div>
          {photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border border-foreground/20">
                  <img src={src} alt={`product ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DropZone>

        {/* Text + barcode — mint */}
        <div className="grid md:grid-cols-[1fr_220px] gap-3">
          <div className="cloud-panel p-4 rounded-lg flex flex-col gap-2">
            <label className="text-[11px] uppercase tracking-[0.18em] font-extrabold" style={{ color: "#163019" }}>
              Type ingredients, label text, or drawing notes
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="e.g. 'Diet cola — aspartame, caramel color IV, phosphoric acid, potassium benzoate'"
              className="w-full text-sm font-medium bg-white/70 border border-foreground/15 rounded-md p-2 resize-none"
            />
          </div>
          <div className="cloud-panel p-4 rounded-lg flex flex-col gap-2">
            <label className="flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] font-extrabold" style={{ color: "#163019" }}>
              <ScanBarcode className="w-3.5 h-3.5" /> Barcode
            </label>
            <input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="UPC / EAN"
              className="w-full text-sm font-medium bg-white/70 border border-foreground/15 rounded-md p-2"
            />
            <p className="text-[10px] font-semibold opacity-70">
              Type or paste the 8–13 digit code from any package.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold"
            style={{ background: "#7a1c2e", color: "#fff" }}
          >
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="px-5 py-2 text-[11px] uppercase tracking-[0.2em] font-extrabold rounded-md text-white disabled:opacity-60"
            style={{ background: "#5a0f22" }}
          >
            {loading ? "Analyzing…" : "Run ToxCheck"}
          </button>
          {(photos.length > 0 || text || barcode || analysis) && (
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-extrabold rounded-md border"
              style={{ borderColor: "#7a1c2e", color: "#7a1c2e" }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Results — Exposure box (same burgundy-pink theme as the ToxCheck tab) */}
      {analysis && (
        <div
          className="rounded-xl p-6 flex flex-col gap-5 shadow-[0_4px_18px_-6px_rgba(120,20,50,0.35)]"
          style={{
            background: "linear-gradient(160deg, #ffe6ec 0%, #ffc2d2 55%, #d99bb0 100%)",
            color: "#4a0f22",
            border: "1px solid rgba(122,28,46,0.35)",
          }}
        >
          <header className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6" strokeWidth={2.5} style={{ color: "#7a1c2e" }} />
              <div>
                <h2 className="font-serif text-2xl font-black" style={{ color: "#5a0f22" }}>
                  Exposure
                </h2>
                <p className="text-xs font-semibold opacity-80">
                  Toxin findings, patient-specific alerts, and the evidence behind the conclusion.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={saveToExposures}
                className="px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-extrabold rounded-md text-white"
                style={{ background: "#5a0f22" }}
              >
                Save to Exposures
              </button>
              {savedCount !== null && (
                <span className="text-[11px] font-extrabold" style={{ color: "#5a0f22" }}>
                  {savedCount > 0 ? `Saved ${savedCount} toxin${savedCount === 1 ? "" : "s"} · ` : "Nothing to save · "}
                  <Link to="/section/$sectionId" params={{ sectionId: "exposures" }} className="underline">
                    View in Exposures
                  </Link>
                </span>
              )}
            </div>
          </header>

          {/* Products & substances */}
          {analysis.products?.map((p, pi) => (
            <article
              key={pi}
              className="cloud-panel p-5 rounded-xl flex flex-col gap-3"
              style={{ borderLeft: "4px solid #7a1c2e" }}
            >
              <header className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-serif text-xl font-black" style={{ color: "#163019" }}>
                  {p.name}
                </h3>
                <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-70">
                  {p.category} · from {p.identified_from}
                </span>
              </header>

              <div className="flex flex-col gap-2">
                {p.substances?.map((s, si) => (
                  <div
                    key={si}
                    className="rounded-md p-3 flex flex-col gap-1"
                    style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(20,40,30,0.12)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-black">{s.name}</span>
                        {s.iarc_group && (
                          <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-70">
                            IARC {s.iarc_group}
                          </span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider font-extrabold opacity-60">
                          {s.category.replace(/_/g, " ")}
                        </span>
                      </div>
                      <SeverityBadge s={s.severity} />
                    </div>
                    <p className="text-sm font-semibold leading-snug">{s.health_effects}</p>
                    <p className="text-xs font-medium opacity-80">
                      <span className="uppercase tracking-wider font-extrabold opacity-70">Status:</span>{" "}
                      {s.regulatory_status}
                    </p>
                    <p
                      className="text-xs font-semibold leading-snug px-2 py-1 rounded"
                      style={{ background: "#ffe6ec", color: "#5a0f22" }}
                    >
                      <span className="uppercase tracking-wider font-extrabold">Mrs. Z:</span>{" "}
                      {s.patient_specific_risk}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          ))}

          {/* Patient alerts */}
          {analysis.patient_alerts?.length > 0 && (
            <div
              className="subspecialty-tab relative overflow-hidden rounded-xl p-5 flex flex-col gap-2"
              style={{
                background:
                  "linear-gradient(135deg, #fffbe6 0%, #fff4c2 30%, #fdebb0 60%, #fff7d1 100%)",
                color: "#6b5a2a",
              }}
            >
              <h3 className="font-serif text-lg font-black flex items-center gap-2 relative z-10">
                <AlertTriangle className="w-5 h-5" strokeWidth={3} /> Patient-specific alerts
              </h3>
              <ul className="flex flex-col gap-1.5 relative z-10">
                {analysis.patient_alerts.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-semibold">
                    <SeverityBadge s={a.severity} />
                    <span>{a.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conclusion */}
          <div
            className="cloud-panel p-5 rounded-xl flex flex-col gap-3"
            style={{ borderTop: "4px solid #7a1c2e" }}
          >
            <h3 className="font-serif text-xl font-black" style={{ color: "#5a0f22" }}>
              Conclusion
            </h3>
            <p className="text-base font-semibold leading-snug">{analysis.conclusion}</p>

            {analysis.references?.length > 0 && (
              <div className="mt-2 border-t border-foreground/20 pt-3">
                <div className="text-[10px] uppercase tracking-[0.2em] font-extrabold opacity-70 mb-1">
                  References used for this conclusion
                </div>
                <ul className="flex flex-col gap-1">
                  {analysis.references.map((r, i) => (
                    <li key={i} className="text-xs font-semibold leading-snug">
                      <span className="font-extrabold">{r.label}.</span> {r.citation}{" "}
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-foreground/50 hover:decoration-foreground"
                        >
                          link
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => {
          addFiles([file]);
          setCameraOpen(false);
        }}
      />
    </section>
  );
}
