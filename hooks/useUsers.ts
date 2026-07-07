import { useEffect, useState, useCallback } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
import { useAuth } from "@/context/AuthContext";
import type { UserProfile } from "@/context/AuthContext";
import { applyFilters, type Filters } from "@/constants/filters";

export function useUsers(filters?: Filters, opts?: { includeIncomplete?: boolean }): {
  users: UserProfile[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { user } = useAuth();
  const includeIncomplete = opts?.includeIncomplete ?? false;
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      setError(null);
      const params = includeIncomplete ? "?includeIncomplete=true" : "";
      const list = await api.get<UserProfile[]>(`/api/users${params}`);
      setUsers(list);
      setLoading(false);
    } catch (e: any) {
      console.error("[useUsers] fetch error:", e?.message || e);
      setError(e);
      setLoading(false);
    }
  }, [user, includeIncomplete]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Listen for online/offline events via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleOnline = (data: { uid: string }) => {
      setUsers((prev) => prev.map((u) => u.uid === data.uid ? { ...u, online: true } : u));
    };
    const handleOffline = (data: { uid: string }) => {
      setUsers((prev) => prev.map((u) => u.uid === data.uid ? { ...u, online: false } : u));
    };

    socket.on("user:online", handleOnline);
    socket.on("user:offline", handleOffline);

    return () => {
      socket.off("user:online", handleOnline);
      socket.off("user:offline", handleOffline);
    };
  }, []);

  const filtered = filters ? applyFilters(users, filters) : users;
  return { users: filtered, loading, error, refetch: fetchUsers };
}
