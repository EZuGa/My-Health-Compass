import { useEffect, useRef, useState, type ElementType } from "react";

/**
 * Inline-editable text persisted to localStorage by `storageKey`.
 */
export function EditableText({
  storageKey,
  defaultValue,
  as,
  className,
  multiline = false,
}: {
  storageKey: string;
  defaultValue: string;
  as?: ElementType;
  className?: string;
  multiline?: boolean;
}) {
  const Tag: ElementType = as ?? "span";
  const [value, setValue] = useState<string>(defaultValue);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v !== null) setValue(v);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const save = () => {
    const next = ref.current?.innerText ?? "";
    setValue(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* ignore */
    }
  };

  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={save}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.target as HTMLElement).blur();
        }
        if (e.key === "Escape") (e.target as HTMLElement).blur();
      }}
      className={
        (className ?? "") +
        " outline-none focus:bg-foreground/5 focus:ring-1 focus:ring-foreground/40 rounded-sm px-0.5 -mx-0.5 cursor-text"
      }
      title="Click to edit"
    >
      {value}
    </Tag>
  );
}
