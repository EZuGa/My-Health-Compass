import { useState, type DragEvent, type ReactNode } from "react";

type Props = {
  onFiles: (files: File[]) => void;
  accept?: (file: File) => boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps any region so a user can drag files from their desktop / file
 * manager and drop them onto it. Shows a subtle overlay while a drag is
 * active. Combine with native <input type="file"> for click-to-pick.
 */
export function DropZone({ onFiles, accept, className, children }: Props) {
  const [over, setOver] = useState(false);

  const handle = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      onDragEnter={(e) => {
        handle(e);
        if (e.dataTransfer?.types?.includes("Files")) setOver(true);
      }}
      onDragOver={(e) => {
        handle(e);
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        handle(e);
        // only clear when leaving the wrapper itself
        if (e.currentTarget === e.target) setOver(false);
      }}
      onDrop={(e) => {
        handle(e);
        setOver(false);
        const files = Array.from(e.dataTransfer?.files ?? []);
        const filtered = accept ? files.filter(accept) : files;
        if (filtered.length) onFiles(filtered);
      }}
      className={`relative ${className ?? ""}`}
    >
      {children}
      {over && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-md border-4 border-dashed border-foreground bg-background/80 text-sm font-extrabold uppercase tracking-wider">
          Drop files to upload
        </div>
      )}
    </div>
  );
}
