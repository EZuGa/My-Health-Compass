import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { findForm, type FormField } from "@/data/medical-forms";
import { getFormSample } from "@/data/medical-form-samples";
import { patient } from "@/data/health";

export const Route = createFileRoute("/_authenticated/forms/$formId")({
  loader: ({ params }) => {
    const form = findForm(params.formId);
    if (!form) throw notFound();
    return { form };
  },
  notFoundComponent: () => (
    <AppShell>
      <p className="font-bold">
        Form not found. <Link to="/forms" className="underline">Back to forms</Link>
      </p>
    </AppShell>
  ),
  errorComponent: ({ error }) => <AppShell><p className="font-bold">{error.message}</p></AppShell>,
  component: FormFiller,
});

const TOKEN_VALUES = (): Record<string, string> => ({
  name: `Record № ${patient.pid}`,
  dob: patient.dob,
  sex: patient.sex,
  pid: patient.pid,
  age: String(patient.age),
});

const applyTokens = (s: string | undefined): string => {
  if (!s) return "";
  const tokens = TOKEN_VALUES();
  return s.replace(/\{\{(\w+)\}\}/g, (_, k) => tokens[k] ?? "");
};

function FormFiller() {
  const { form } = Route.useLoaderData();
  const storageKey = `form:${form.id}:values`;
  const [view, setView] = useState<"document" | "fields">("document");

  const initial = useMemo<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const f of form.fields) o[f.id] = applyTokens(f.default);
    return o;
  }, [form]);

  const [values, setValues] = useState<Record<string, string>>(initial);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setValues({ ...initial, ...JSON.parse(saved) });
    } catch {
      /* ignore */
    }
  }, [storageKey, initial]);

  const update = (id: string, v: string) => {
    setValues((prev) => {
      const next = { ...prev, [id]: v };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // ----- Sample document (markdown), per-form, editable & persisted -----
  const sampleKey = `form:${form.id}:sample-html`;
  const sampleMd = getFormSample(form.id);
  const defaultSampleHtml = useMemo(
    () => (sampleMd ? mdToHtml(sampleMd) : buildFallbackHtml(form, initial)),
    [sampleMd, form, initial],
  );
  const articleRef = useRef<HTMLElement | null>(null);

  // Restore saved edits into the document on mount / when switching to it.
  useEffect(() => {
    if (view !== "document" || !articleRef.current) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(sampleKey);
    } catch {
      /* ignore */
    }
    articleRef.current.innerHTML = saved ?? defaultSampleHtml;
  }, [view, sampleKey, defaultSampleHtml]);

  const saveDocument = () => {
    if (!articleRef.current) return;
    try {
      localStorage.setItem(sampleKey, articleRef.current.innerHTML);
    } catch {
      /* ignore */
    }
  };

  const reset = () => {
    if (!confirm("Reset to the original sample document?")) return;
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(sampleKey);
    } catch {
      /* ignore */
    }
    setValues(initial);
    if (articleRef.current) articleRef.current.innerHTML = defaultSampleHtml;
  };


  const downloadPdf = () => {
    // Prefer the live edited document content; fall back to a freshly rendered version.
    const live = articleRef.current?.innerHTML;
    const body = live && live.trim().length > 0 ? live : defaultSampleHtml;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(form.number)} — ${escapeHtml(form.name)}</title>
<style>
  @page { margin: 16mm; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; font-size: 11pt; line-height: 1.5; }
  .head { border-bottom: 2px solid #000; padding-bottom: 8pt; margin-bottom: 14pt; }
  .num { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.18em; color: #444; }
  .name { font-size: 16pt; font-weight: 800; margin-top: 2pt; }
  .issuer { font-size: 10pt; color: #333; margin-top: 2pt; }
  .purpose { font-size: 10pt; font-style: italic; color: #222; margin-top: 6pt; }
  h1, h2, h3, h4 { font-family: Georgia, 'Times New Roman', serif; }
  h1 { font-size: 14pt; margin: 12pt 0 6pt; }
  h2 { font-size: 12pt; margin: 10pt 0 4pt; border-bottom: 1px solid #888; padding-bottom: 2pt; }
  h3 { font-size: 11pt; margin: 8pt 0 3pt; }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0; font-size: 10pt; }
  th, td { border: 1px solid #bbb; padding: 4pt 6pt; vertical-align: top; text-align: left; }
  th { background: #eee; }
  ul, ol { padding-left: 18pt; margin: 4pt 0; }
  hr { border: 0; border-top: 1px solid #888; margin: 10pt 0; }
  .src { font-size: 8pt; color: #777; margin-top: 14pt; word-break: break-all; }
</style></head><body>
<div class="head">
  <div class="num">${escapeHtml(form.number)} · ${escapeHtml(form.category.toUpperCase())}</div>
  <div class="name">${escapeHtml(form.name)}</div>
  <div class="issuer">${escapeHtml(form.issuer)}</div>
  <div class="purpose">${escapeHtml(form.purpose)}</div>
</div>
${body}
<div class="src">Source: ${escapeHtml(form.url)} · Generated by The Health Passport on ${escapeHtml(new Date().toLocaleString())}. Content-equivalent rendering — for official submission, transfer values to the issuer's PDF.</div>
<script>window.onload = () => { window.focus(); window.print(); };</script>
</body></html>`);
    win.document.close();
  };

  return (
    <AppShell>
      <Link to="/forms" className="text-xs uppercase tracking-[0.22em] font-extrabold underline">
        ← All forms
      </Link>

      <header className="mt-2">
        <div className="text-[11px] uppercase tracking-[0.22em] font-extrabold opacity-80">
          {form.number} · {form.issuer}
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-black mt-1">{form.name}</h1>
        <p className="mt-2 max-w-4xl font-semibold">{form.purpose}</p>
        <p className="mt-1 text-xs font-bold opacity-70">
          Source:{" "}
          <a className="underline" href={form.url.startsWith("http") ? form.url : "#"} target="_blank" rel="noopener noreferrer">
            {form.url}
          </a>
        </p>
      </header>

      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <div className="inline-flex rounded-md overflow-hidden border border-foreground/30">
          <button
            type="button"
            onClick={() => setView("document")}
            className={`text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-2 ${view === "document" ? "bg-[color:var(--mint)]" : "bg-background/40"}`}
          >
            Document
          </button>
          <button
            type="button"
            onClick={() => setView("fields")}
            className={`text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-2 border-l border-foreground/30 ${view === "fields" ? "bg-[color:var(--mint)]" : "bg-background/40"}`}
          >
            Fields
          </button>
        </div>
        <button
          type="button"
          onClick={downloadPdf}
          className="text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-2 rounded-md cloud-panel"
          style={{ background: "linear-gradient(160deg, #d5ecd5 0%, #a8d5a8 100%)", color: "#163019" }}
        >
          Download PDF
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-2 rounded-md cloud-panel opacity-80"
        >
          Reset to auto-fill
        </button>
      </div>

      {view === "document" ? (
        <article
          ref={articleRef as never}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={saveDocument}
          className="form-document mt-5 mx-auto w-full max-w-[8.5in] bg-white text-black shadow-[0_4px_24px_-6px_rgba(0,0,0,0.25)] rounded-md p-10 [font-family:Helvetica,Arial,sans-serif] text-[11pt] leading-[1.6] outline-none focus:ring-2 focus:ring-[color:var(--mint)]"
        />
      ) : (
        <form className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => e.preventDefault()}>
          {form.fields.map((fld: FormField) => (
            <Field key={fld.id} field={fld} value={values[fld.id] ?? ""} onChange={(v) => update(fld.id, v)} />
          ))}
        </form>
      )}
    </AppShell>
  );
}

// ---------- Markdown → HTML for sample documents ----------
function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  const flushPara = (buf: string[]) => {
    if (!buf.length) return;
    const text = inline(buf.join(" ").trim());
    if (text) out.push(`<p>${text}</p>`);
    buf.length = 0;
  };

  while (i < lines.length) {
    const ln = lines[i];

    // Horizontal rule
    if (/^---+\s*$/.test(ln)) {
      out.push("<hr/>");
      i++;
      continue;
    }

    // Heading
    const h = /^(#{1,4})\s+(.*)$/.exec(ln);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Table block
    if (/^\s*\|.*\|\s*$/.test(ln) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? "")) {
      const header = splitRow(ln);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      out.push(
        `<table><thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("")}</tbody></table>`,
      );
      continue;
    }

    // Bullet list
    if (/^[-*]\s+/.test(ln)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(ln)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Blank line
    if (ln.trim() === "") {
      i++;
      continue;
    }

    // Paragraph block (collect until blank/structural)
    const buf: string[] = [ln];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,4})\s/.test(lines[i]) &&
      !/^---+\s*$/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^\s*\|.*\|\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    flushPara(buf);
  }
  return out.join("\n");
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((s) => s.trim());
}

function inline(s: string): string {
  // Escape HTML first
  let t = s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Bold **x**
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic *x*
  t = t.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  // Inline code `x`
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  return t;
}

function buildFallbackHtml(
  form: { fields: FormField[] },
  values: Record<string, string>,
): string {
  const rows = form.fields
    .map((fld) => {
      const v = (values[fld.id] ?? "").toString();
      const safe = escapeHtml(v).replace(/\n/g, "<br>");
      return `<tr><th style="width:38%">${escapeHtml(fld.label)}</th><td>${safe || "—"}</td></tr>`;
    })
    .join("");
  return `<table>${rows}</table>`;
}



function Field({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  const span = field.cols === 2 ? "md:col-span-2" : "";
  const inputClass =
    "w-full bg-background/70 border border-foreground/30 rounded-md px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[color:var(--mint)]";
  return (
    <label className={`cloud-panel p-3 flex flex-col gap-1.5 ${span}`}>
      <span className="text-[10px] uppercase tracking-[0.18em] font-extrabold opacity-80">
        {field.label}
      </span>
      {field.type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.max(3, Math.min(8, (value.match(/\n/g)?.length ?? 0) + 2))}
          className={inputClass}
        />
      ) : field.type === "select" ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">— select —</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <input
          type="checkbox"
          checked={value === "yes"}
          onChange={(e) => onChange(e.target.checked ? "yes" : "")}
          className="w-5 h-5"
        />
      ) : (
        <input
          type={field.type === "date" ? "date" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}
      {field.hint && <span className="text-[10px] font-semibold opacity-70">{field.hint}</span>}
    </label>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
