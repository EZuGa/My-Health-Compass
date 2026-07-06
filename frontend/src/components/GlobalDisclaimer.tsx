import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

const ACK_KEY = "disclaimer:ack-v1";

export function GlobalDisclaimer() {
  const [acked, setAcked] = useState(true);
  useEffect(() => {
    setAcked(localStorage.getItem(ACK_KEY) === "1");
  }, []);

  const ack = () => {
    localStorage.setItem(ACK_KEY, "1");
    setAcked(true);
  };

  return (
    <>
      {/* Persistent thin banner */}
      <div
        className="w-full text-[11px] uppercase tracking-[0.18em] font-extrabold flex items-center justify-center gap-2 py-1.5 px-3"
        style={{ background: "#fff4c2", color: "#5a4500", borderBottom: "1px solid rgba(90,69,0,0.25)" }}
        role="note"
      >
        <Info className="w-3.5 h-3.5" />
        Information organizer — not a medical device, not a diagnosis, not medical advice.
      </div>

      {/* First-run modal */}
      {!acked && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: "rgba(20,20,30,0.55)" }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-lg w-full rounded-xl p-6 flex flex-col gap-4"
            style={{ background: "#fffbe6", color: "#3a2a10", border: "1px solid rgba(90,69,0,0.35)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-2xl font-black">Before you continue</h2>
              <button
                onClick={ack}
                className="p-1 rounded-md hover:bg-black/5"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-semibold leading-snug">
              The Health Passport is a <span className="font-extrabold">personal
              health-information organizer</span>. It helps you collect, structure,
              and share your own medical information.
            </p>
            <ul className="text-sm font-semibold leading-snug list-disc pl-5 space-y-1">
              <li>It is <span className="font-extrabold">not a medical device</span> and has not been reviewed or cleared by the FDA.</li>
              <li>It does <span className="font-extrabold">not diagnose</span>, treat, cure, or prevent any condition.</li>
              <li>AI-generated summaries, timelines, and alerts are <span className="font-extrabold">informational only</span> — always discuss them with a qualified clinician.</li>
              <li>In an emergency, call your local emergency number.</li>
            </ul>
            <button
              onClick={ack}
              className="self-end px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-extrabold rounded-md text-white"
              style={{ background: "#5a4500" }}
            >
              I understand
            </button>
          </div>
        </div>
      )}
    </>
  );
}
