import { useEffect, useState } from "react";
import { auth, getCachedUser, isAuthed } from "@/lib/api";
import { useSelectedPatient } from "@/lib/selectedPatient";

/**
 * The patient id whose data the current pages should render.
 *
 * For a patient this is always their own id. For a doctor who has opened a
 * patient from the search page it is the selected patient's id; a doctor
 * without an open patient gets their own (empty) id back.
 * Null while loading or when not signed in. The api layer caches the user in
 * localStorage, so there's no round-trip on mount once the user was fetched.
 */
export function usePatientId(): number | null {
  const [ownId, setOwnId] = useState<number | null>(() => getCachedUser()?.id ?? null);
  const selected = useSelectedPatient();

  useEffect(() => {
    let cancelled = false;
    if (!isAuthed()) return;
    (async () => {
      try {
        const user = await auth.me();
        if (!cancelled) setOwnId(user.id);
      } catch {
        // best-effort; components fall back to localStorage
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (getCachedUser()?.role === "doctor" && selected) return selected.id;
  return ownId;
}
