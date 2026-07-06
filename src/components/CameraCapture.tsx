import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function CameraCapture({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setError(null);
    setReady(false);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API not available in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open camera.");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
    };
  }, [open]);

  if (!open) return null;

  const snap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-black p-4 max-w-3xl w-full flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.18em] font-extrabold">Camera</div>
          <button
            type="button"
            onClick={onClose}
            className="text-[11px] font-bold underline"
          >
            close
          </button>
        </div>
        {error ? (
          <div className="p-6 text-sm font-bold text-red-700">{error}</div>
        ) : (
          <div className="relative bg-black aspect-video w-full overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold border-2 border-black"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!ready || !!error}
            onClick={snap}
            className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-extrabold bg-[color:var(--mint-deep)] disabled:opacity-50"
          >
            📷 Capture
          </button>
        </div>
      </div>
    </div>
  );
}
