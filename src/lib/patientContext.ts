import {
  boxes,
  diagnostics,
  medications,
  appointments,
  reminders,
  interventions,
  patient,
  nejmSections,
} from "@/data/health";

function latest<T extends { date: string; value: number }>(series: T[]) {
  if (!series.length) return null;
  return [...series].sort((a, b) => a.date.localeCompare(b.date)).at(-1)!;
}

function readToxins(): Array<{ name: string; severity?: string; source?: string; note?: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("zrunva.toxins.v1");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export function buildPatientContext(): string {
  const lines: string[] = [];

  lines.push(`# PATIENT`);
  lines.push(`Record №: ${patient.pid} (de-identified); DOB: ${patient.dob}; Age: ${patient.age}; Sex: ${patient.sex}`);

  lines.push(`\n# APP SECTIONS (where data lives)`);
  for (const s of nejmSections) lines.push(`- ${s.title}`);

  lines.push(`\n# HEALTH DOMAINS — latest values`);
  for (const b of boxes) {
    lines.push(`\n## ${b.title} (${b.subtitle})`);
    for (const m of b.metrics) {
      const last = latest(m.series);
      if (!last) continue;
      lines.push(`- ${m.name}: ${last.value} ${m.unit} (on ${last.date})${m.reference ? `, ref ${m.reference}` : ""}`);
    }
  }

  lines.push(`\n# MEDICATIONS`);
  for (const m of medications) lines.push(`- ${m.name}, times ${m.times.join("/")}, since ${m.since}`);

  lines.push(`\n# INTERVENTIONS / TIMELINE`);
  for (const i of interventions) lines.push(`- ${i.date}: ${i.label} (${i.kind})`);

  lines.push(`\n# UPCOMING APPOINTMENTS`);
  for (const a of appointments) lines.push(`- ${a.date} ${a.time}: ${a.title}`);

  lines.push(`\n# REMINDERS`);
  for (const r of reminders) lines.push(`- ${r.date}: ${r.title}`);

  lines.push(`\n# DIAGNOSTIC LABS / IMAGING — latest values`);
  const byCat = new Map<string, string[]>();
  for (const d of diagnostics) {
    const last = latest(d.series);
    if (!last) continue;
    const line = `- ${d.name}: ${last.value} ${d.unit} (on ${last.date})${d.reference ? `, ref ${d.reference}` : ""}`;
    const arr = byCat.get(d.category) ?? [];
    arr.push(line);
    byCat.set(d.category, arr);
  }
  for (const [cat, arr] of byCat) {
    lines.push(`\n## ${cat}`);
    for (const l of arr) lines.push(l);
  }

  const toxins = readToxins();
  if (toxins.length) {
    lines.push(`\n# TOXINS / EXPOSURES (ToxCheck saved)`);
    for (const t of toxins) {
      lines.push(`- ${t.name}${t.severity ? ` [${t.severity}]` : ""}${t.source ? ` — ${t.source}` : ""}${t.note ? ` — ${t.note}` : ""}`);
    }
  }

  return lines.join("\n");
}
