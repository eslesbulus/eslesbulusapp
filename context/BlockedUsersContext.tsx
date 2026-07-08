import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

type BlockedUser = {
  id: string;
  name: string;
  photo: string;
  blockedAt: number;
};

type Ctx = {
  blockedUsers: BlockedUser[];
  blockUser: (user: { uid: string; name: string; photoURL?: string; photos?: string[] }) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;
};

const BlockedUsersContext = createContext<Ctx | null>(null);

export function BlockedUsersProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);

  // Load from profile
  useEffect(() => {
    if (!profile) {
      setBlocked([]);
      return;
    }
    const list: BlockedUser[] = ((profile as any).blockedUsers ?? []).map((b: any) => ({
      id: b.uid,
      name: b.name ?? "",
      photo: b.photo ?? "",
      blockedAt: b.at ? new Date(b.at).getTime() : Date.now(),
    }));
    list.sort((a, b) => b.blockedAt - a.blockedAt);
    setBlocked(list);
  }, [profile]);

  const blockUser = useCallback(
    async (u: { uid: string; name: string; photoURL?: string; photos?: string[] }) => {
      if (!user?.uid || u.uid === user.uid) return;
      if (blocked.some((b) => b.id === u.uid)) return;
      const photo = u.photoURL || u.photos?.[0] || "";
      setBlocked((prev) => {
        if (prev.some((b) => b.id === u.uid)) return prev;
        return [{ id: u.uid, name: u.name, photo, blockedAt: Date.now() }, ...prev];
      });
      await api.post("/api/users/me/block", { targetUid: u.uid, name: u.name, photo });
    },
    [user?.uid, blocked]
  );

  const unblockUser = useCallback(
    async (userId: string) => {
      if (!user?.uid) return;
      const prev = blocked;
      setBlocked((p) => p.filter((b) => b.id !== userId));
      try {
        await api.post("/api/users/me/unblock", { targetUid: userId });
      } catch {
        setBlocked(prev);
      }
    },
    [user?.uid, blocked]
  );

  const isBlocked = useCallback(
    (userId: string) => blocked.some((b) => b.id === userId),
    [blocked]
  );

  const value = useMemo(
    () => ({ blockedUsers: blocked, blockUser, unblockUser, isBlocked }),
    [blocked, blockUser, unblockUser, isBlocked]
  );

  return <BlockedUsersContext.Provider value={value}>{children}</BlockedUsersContext.Provider>;
}

export function useBlockedUsers() {
  const ctx = useContext(BlockedUsersContext);
  if (!ctx) throw new Error("useBlockedUsers must be inside BlockedUsersProvider");
  return ctx;
}
