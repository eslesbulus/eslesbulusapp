import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/context/AuthContext";
import { applyFilters, type Filters } from "@/constants/filters";

/**
 * Real-time subscription to the `users` collection.
 * - Filters out the current user's own doc.
 * - Only returns users with `profileComplete: true`.
 * - If `filters` is supplied, applies the same predicate as `applyFilters()`.
 */
export function useUsers(filters?: Filters, opts?: { includeIncomplete?: boolean }): {
  users: UserProfile[];
  loading: boolean;
  error: Error | null;
} {
  const { user } = useAuth();
  const includeIncomplete = opts?.includeIncomplete ?? false;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((d) => {
          const data = d.data() as UserProfile;
          if (!includeIncomplete && !data.profileComplete) return;
          if (user && data.uid === user.uid) return;
          list.push(data);
        });
        setUsers(list);
        setLoading(false);
      },
      (e) => {
        setError(e as Error);
        setLoading(false);
      }
    );
    return unsub;
  }, [user?.uid, includeIncomplete]);

  const filtered = filters ? applyFilters(users, filters) : users;
  return { users: filtered, loading, error };
}
