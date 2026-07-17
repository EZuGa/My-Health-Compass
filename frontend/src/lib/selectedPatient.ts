import { useEffect, useState } from "react";

// The patient a doctor has opened. Persisted in localStorage so the whole app
// (dashboard, records, timeline, ...) renders that patient's data via
// usePatientId until the doctor exits the patient view. Component-local state
// is synced through a window event (plus cross-tab "storage").

const KEY = "zrunva.selectedPatient";
const EVENT = "zrunva-selected-patient-changed";

export type SelectedPatient = { id: number; name: string };

export function getSelectedPatient(): SelectedPatient | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SelectedPatient;
    return typeof parsed?.id === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export function setSelectedPatient(p: SelectedPatient | null) {
  if (p) localStorage.setItem(KEY, JSON.stringify(p));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function useSelectedPatient(): SelectedPatient | null {
  const [patient, setPatient] = useState<SelectedPatient | null>(() => getSelectedPatient());
  useEffect(() => {
    const onChange = () => setPatient(getSelectedPatient());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return patient;
}
