import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getOrCreatePatient } from "@/lib/patient-data.functions";
import { patient as patientMock } from "@/data/health";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "zrunva.patient.id.v1";

/**
 * Ensures a `patients` row exists for the current user keyed by the local
 * record number (pid). Returns the patient row id, or null while loading or
 * if the user is not signed in. Caches the id in localStorage to avoid an
 * extra round-trip on every mount.
 */
export function usePatientId() {
  const ensure = useServerFn(getOrCreatePatient);
  const [id, setId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return; // not signed in — skip silently
        const row = await ensure({
          data: {
            pid: patientMock.pid,
            display_name: null,
            dob: patientMock.dob,
            sex: patientMock.sex,
          },
        });
        if (cancelled) return;
        if (row?.id) {
          setId(row.id);
          try {
            window.localStorage.setItem(STORAGE_KEY, row.id);
          } catch {}
        }
      } catch (err) {
        // best-effort; UI still works against local storage
        console.warn("usePatientId failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ensure]);

  return id;
}
