import { useEffect, useState } from "react";
import { api } from "@/config/api";
import type { UserProfile } from "@/context/AuthContext";

/**
 * Fetch a single user by UID from the API.
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
    let cancelled = false;

    api.get<UserProfile>(`/api/users/${uid}`)
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e);
          setUser(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [uid]);

  return { user, loading, error };
}
