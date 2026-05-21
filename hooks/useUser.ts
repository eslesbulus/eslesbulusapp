import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { UserProfile } from "@/context/AuthContext";

/**
 * Real-time subscription to a single user doc by UID.
 * Returns { user: null, loading: false } if the doc doesn't exist.
 */
export function useUser(uid: string | null | undefined): {
  user: UserProfile | null;
  loading: boolean;
  error: Error | null;
} {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        setUser(snap.exists() ? (snap.data() as UserProfile) : null);
        setLoading(false);
      },
      (e) => {
        setError(e as Error);
        setLoading(false);
      }
    );
    return unsub;
  }, [uid]);

  return { user, loading, error };
}
