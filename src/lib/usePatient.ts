import { useEffect, useState } from "react";
import { auth, getCachedUser, isAuthed } from "@/lib/api";

/**
 * Returns the signed-in user's id (the patient id in the backend, since a
 * patient owns their own record). Null while loading or when not signed in.
 * The api layer caches the user in localStorage, so there's no round-trip on
 * mount once the user has been fetched.
 */
export function usePatientId(): number | null {
  const [id, setId] = useState<number | null>(() => getCachedUser()?.id ?? null);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthed()) return;
    (async () => {
      try {
        const user = await auth.me();
        if (!cancelled) setId(user.id);
      } catch {
        // best-effort; components fall back to localStorage
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return id;
}
