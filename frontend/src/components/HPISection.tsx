import { useRef, useState } from "react";
import { Mic, MicOff, Camera, ImagePlus, Upload, Sparkles, Loader2 } from "lucide-react";
import { DropZone } from "@/components/DropZone";
import { CameraCapture } from "@/components/CameraCapture";
import { api } from "@/lib/api";

// HPI categories — narrative skeleton the agent fills in.
const CATEGORIES = [
  { key: "onset", label: "Symptom onset", hints: ["start", "began", "started", "noticed", "ago", "yesterday", "weeks", "days", "hours", "sudden", "gradual"] },
  { key: "char", label: "Symptom characterization", hints: ["sharp", "dull", "burning", "pressure", "throbbing", "aching", "cramping", "tight", "heavy", "stabbing", "severe", "mild", "moderate"] },
  { key: "loc", label: "Location & radiation", hints: ["chest", "arm", "back", "leg", "head", "abdomen", "radiates", "down", "into", "left", "right"] },
  { key: "dur", label: "Duration", hints: ["lasting", "minutes", "hours", "days", "weeks", "continuous", "intermittent"] },
  { key: "prog", label: "Progression", hints: ["worse", "better", "worsening", "improving", "stable", "comes and goes", "episodic"] },
  { key: "allev", label: "Alleviating factors", hints: ["rest", "helps", "relieves", "better with", "improves with", "medication", "ibuprofen", "tylenol"] },
  { key: "exac", label: "Exacerbating factors", hints: ["worse with", "triggered by", "exercise", "exertion", "stress", "food", "lying", "walking"] },
  { key: "assoc", label: "Associated symptoms", hints: ["nausea", "vomiting", "sweating", "dizziness", "shortness of breath", "palpitations", "fever", "chills"] },
  { key: "neg", label: "Pertinent negatives", hints: ["no ", "denies", "without", "not", "never"] },
  { key: "prior_ep", label: "Prior episodes", hints: ["before", "previously", "last time", "happened", "similar", "again"] },
  { key: "prior_wk", label: "Prior workup", hints: ["scan", "mri", "ct", "ecg", "x-ray", "blood test", "echo", "tested"] },
  { key: "prior_tx", label: "Prior treatments", hints: ["tried", "took", "treatment", "physical therapy", "surgery", "prescribed"] },
  { key: "func", label: "Functional impact", hints: ["work", "sleep", "walk", "stairs", "exercise", "daily", "unable", "cannot"] },
];

function organizeNarrative(text: string) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const buckets: Record<string, string[]> = Object.fromEntries(
    CATEGORIES.map((c) => [c.key, []])
  );

  for (const s of sentences) {
    const low = s.toLowerCase();
    let placed = false;
    for (const cat of CATEGORIES) {
      if (cat.hints.some((h) => low.includes(h))) {
        buckets[cat.key].push(s);
        placed = true;
      }
    }
    if (!placed) buckets["char"].push(s);
  }
  return buckets;
}

export function HPISection() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recogRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

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
      for (let i = 0; i < e.results.length; i++) {
        final += e.results[i][0].transcript + " ";
      }
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

  const startRecording = async () => {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
        const blob = new Blob(audioChunksRef.current, { type: mime });
        if (blob.size < 2048) {
          setVoiceError("That recording was too short — please try again.");
          return;
        }
        setTranscribing(true);
        try {
          const { text } = await api.transcribeAudio(blob, mime);
          if (text) {
            setTranscript((prev) => (prev ? prev.trim() + " " + text : text));
          } else {
            setVoiceError("No speech was detected.");
          }
        } catch (err: any) {
          setVoiceError(err?.message ?? "Transcription failed.");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (err: any) {
      setVoiceError(err?.message ?? "Microphone access was denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const ingestFiles = (files: File[]) => {
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => setImages((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    ingestFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const buckets = organizeNarrative(transcript);
  const hasAnyContent = transcript.trim().length > 0;

  return (
    <div className="mt-6 max-w-4xl space-y-6">
      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => ingestFiles([file])}
      />
      <p className="leading-relaxed">
        Speak or type your story. The narrative is organized into the thirteen
        elements of the History of Present Illness for your records — this is an
        information organizer, not a medical assessment.
      </p>

      {/* Voice + text input */}
      <div className="border border-foreground bg-card rounded-md p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-serif text-xl">Patient voice</h2>
          <div className="flex flex-wrap gap-2">
            {/* AI voice intake — Lovable AI transcription (Whisper) */}
            {recording ? (
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-1.5 border border-foreground bg-destructive text-destructive-foreground px-3 py-1.5 rounded-sm text-sm"
              >
                <MicOff className="h-4 w-4" /> Stop & transcribe
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={transcribing}
                className="inline-flex items-center gap-1.5 border border-foreground px-3 py-1.5 rounded-sm text-sm disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #fff4c2, #c9b8ee)" }}
                title="Records audio and transcribes it with AI"
              >
                {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {transcribing ? "Transcribing…" : "AI voice intake"}
              </button>
            )}
            {listening ? (
              <button
                onClick={stopListening}
                className="inline-flex items-center gap-1.5 border border-foreground bg-destructive text-destructive-foreground px-3 py-1.5 rounded-sm text-sm"
              >
                <MicOff className="h-4 w-4" /> Stop
              </button>
            ) : (
              <button
                onClick={startListening}
                className="inline-flex items-center gap-1.5 border border-foreground bg-mint-deep px-3 py-1.5 rounded-sm text-sm"
              >
                <Mic className="h-4 w-4" /> Live dictate
              </button>
            )}
          </div>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          placeholder="Tell the story of what brought you in today — when it began, what it feels like, what makes it better or worse, what you've tried…"
          className="w-full border border-foreground/50 bg-background p-3 rounded-sm font-serif text-base resize-y"
        />
        {(listening || recording) && (
          <div className="mt-2 text-xs flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-destructive dali-pulse" />
            {recording ? "Recording — press Stop to transcribe with AI." : "Listening…"}
          </div>
        )}
        {voiceError && (
          <div className="mt-2 text-xs font-bold text-destructive">{voiceError}</div>
        )}
      </div>

      {/* Photo upload */}
      <div className="border border-foreground bg-card rounded-md p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="font-serif text-xl">Photographs</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="inline-flex items-center gap-1.5 border border-foreground bg-background px-3 py-1.5 rounded-sm text-sm cursor-pointer"
            >
              <Camera className="h-4 w-4" /> Take photo
            </button>
            <label className="inline-flex items-center gap-1.5 border border-foreground bg-background px-3 py-1.5 rounded-sm text-sm cursor-pointer">
              <Upload className="h-4 w-4" /> Upload
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhoto}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <p className="text-xs opacity-70">
          Take a picture with your camera, upload from your device, or drag &amp; drop photos of
          rashes, bruises, swelling, or wounds. They are saved to the chart and translated into a
          physical-exam narrative.
        </p>
        <DropZone onFiles={ingestFiles} accept={(f) => f.type.startsWith("image/")} className="mt-3">
          {images.length === 0 ? (
            <div className="flex items-center justify-center border border-dashed border-foreground/40 rounded-sm py-8 text-xs opacity-60">
              <ImagePlus className="h-4 w-4 mr-2" /> No photographs uploaded yet — drop images here.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((src, i) => (
                <figure key={i} className="border border-foreground rounded-sm overflow-hidden">
                  <img src={src} alt={`Patient-supplied photograph ${i + 1}`} className="w-full h-32 object-cover" />
                  <figcaption className="px-2 py-1 text-[11px] border-t border-foreground/40">
                    Photograph {i + 1} — pending AI dermatologic description
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </DropZone>
      </div>

      {/* Organized HPI */}
      <div className="border border-foreground bg-card rounded-md p-4">
        <h2 className="font-serif text-xl mb-3">Organized History of Present Illness</h2>
        {!hasAnyContent && (
          <p className="text-sm opacity-70">
            The narrative will appear here, organized into the thirteen HPI elements, as soon as
            you begin speaking or typing above.
          </p>
        )}
        {hasAnyContent && (
          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const items = buckets[cat.key];
              return (
                <div key={cat.key} className="border-l-2 border-foreground/60 pl-3">
                  <div className="text-[11px] uppercase tracking-[0.18em] opacity-70">
                    {cat.label}
                  </div>
                  <div className="text-base mt-0.5">
                    {items.length > 0 ? items.join(" ") : <span className="opacity-40">—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
