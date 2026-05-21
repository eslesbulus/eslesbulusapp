import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
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

function tsToMs(v: unknown): number {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === "number") return v;
  return Date.now();
}

export function BlockedUsersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setBlocked([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "blocked"),
      (snap) => {
        const list: BlockedUser[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            name: data.name ?? "",
            photo: data.photo ?? "",
            blockedAt: tsToMs(data.at),
          });
        });
        list.sort((a, b) => b.blockedAt - a.blockedAt);
        setBlocked(list);
      },
      () => setBlocked([])
    );
    return unsub;
  }, [user?.uid]);

  const blockUser = useCallback(
    async (u: { uid: string; name: string; photoURL?: string; photos?: string[] }) => {
      if (!user?.uid || u.uid === user.uid) return;
      const photo = u.photoURL || u.photos?.[0] || "";
      await setDoc(doc(db, "users", user.uid, "blocked", u.uid), {
        name: u.name,
        photo,
        at: serverTimestamp(),
      });
    },
    [user?.uid]
  );

  const unblockUser = useCallback(
    async (userId: string) => {
      if (!user?.uid) return;
      await deleteDoc(doc(db, "users", user.uid, "blocked", userId));
    },
    [user?.uid]
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
