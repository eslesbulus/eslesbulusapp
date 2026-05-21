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
import { HI_MESSAGES } from "@/constants/messageTemplates";

export type SentHi = {
  userId: string;
  messageId: string;
  text: string;
  emoji: string;
  at: number;
};

type LikedRef = {
  uid: string;
  at: number;
};

type Ctx = {
  sentHis: Record<string, SentHi>;
  hasSent: (userId: string) => boolean;
  sendRandomHi: (userId: string) => Promise<SentHi | null>;
  likedUsers: Record<string, LikedRef>;
  isLiked: (userId: string) => boolean;
  toggleLike: (user: { uid: string }) => Promise<boolean>;
};

const InteractionsContext = createContext<Ctx | null>(null);

function tsToMs(v: unknown): number {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === "number") return v;
  return Date.now();
}

export function InteractionsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sentHis, setSentHis] = useState<Record<string, SentHi>>({});
  const [likedUsers, setLikedUsers] = useState<Record<string, LikedRef>>({});

  // Subscribe to sent_his
  useEffect(() => {
    if (!user?.uid) {
      setSentHis({});
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "sent_his"),
      (snap) => {
        const next: Record<string, SentHi> = {};
        snap.forEach((d) => {
          const data = d.data();
          next[d.id] = {
            userId: d.id,
            messageId: data.messageId ?? "",
            text: data.text ?? "",
            emoji: data.emoji ?? "",
            at: tsToMs(data.at),
          };
        });
        setSentHis(next);
      },
      () => setSentHis({})
    );
    return unsub;
  }, [user?.uid]);

  // Subscribe to liked
  useEffect(() => {
    if (!user?.uid) {
      setLikedUsers({});
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "liked"),
      (snap) => {
        const next: Record<string, LikedRef> = {};
        snap.forEach((d) => {
          const data = d.data();
          next[d.id] = { uid: d.id, at: tsToMs(data.at) };
        });
        setLikedUsers(next);
      },
      () => setLikedUsers({})
    );
    return unsub;
  }, [user?.uid]);

  const hasSent = useCallback((id: string) => !!sentHis[id], [sentHis]);

  const sendRandomHi = useCallback(
    async (userId: string): Promise<SentHi | null> => {
      if (!user?.uid) return null;
      const existing = sentHis[userId];
      if (existing) return existing;
      const msg = HI_MESSAGES[Math.floor(Math.random() * HI_MESSAGES.length)];
      const sent: SentHi = {
        userId,
        messageId: msg.id,
        text: msg.text,
        emoji: msg.emoji,
        at: Date.now(),
      };
      await setDoc(doc(db, "users", user.uid, "sent_his", userId), {
        messageId: msg.id,
        text: msg.text,
        emoji: msg.emoji,
        at: serverTimestamp(),
      });
      // Optimistic local update — snapshot will overwrite shortly.
      setSentHis((prev) => ({ ...prev, [userId]: sent }));
      return sent;
    },
    [sentHis, user?.uid]
  );

  const isLiked = useCallback((userId: string) => !!likedUsers[userId], [likedUsers]);

  const toggleLike = useCallback(
    async (u: { uid: string }): Promise<boolean> => {
      if (!user?.uid) return false;
      const ref = doc(db, "users", user.uid, "liked", u.uid);
      if (likedUsers[u.uid]) {
        await deleteDoc(ref);
        return false;
      }
      await setDoc(ref, { at: serverTimestamp() });
      return true;
    },
    [likedUsers, user?.uid]
  );

  const value = useMemo(
    () => ({ sentHis, hasSent, sendRandomHi, likedUsers, isLiked, toggleLike }),
    [sentHis, hasSent, sendRandomHi, likedUsers, isLiked, toggleLike]
  );

  return (
    <InteractionsContext.Provider value={value}>{children}</InteractionsContext.Provider>
  );
}

export function useInteractions() {
  const ctx = useContext(InteractionsContext);
  if (!ctx) throw new Error("useInteractions outside provider");
  return ctx;
}
