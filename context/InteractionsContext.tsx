import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
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

export function InteractionsProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [sentHis, setSentHis] = useState<Record<string, SentHi>>({});
  const [likedUsers, setLikedUsers] = useState<Record<string, LikedRef>>({});

  // Load from profile
  useEffect(() => {
    if (!profile) {
      setSentHis({});
      setLikedUsers({});
      return;
    }

    // sentHis
    const his: Record<string, SentHi> = {};
    (profile as any).sentHis?.forEach((h: any) => {
      his[h.userId] = {
        userId: h.userId,
        messageId: h.messageId ?? "",
        text: h.text ?? "",
        emoji: h.emoji ?? "",
        at: h.at ? new Date(h.at).getTime() : Date.now(),
      };
    });
    setSentHis(his);

    // likedUsers
    const liked: Record<string, LikedRef> = {};
    (profile as any).likedUsers?.forEach((l: any) => {
      liked[l.uid] = { uid: l.uid, at: l.at ? new Date(l.at).getTime() : Date.now() };
    });
    setLikedUsers(liked);
  }, [profile]);

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

      // Send hi via API
      await api.post("/api/users/me/send-hi", {
        userId,
        messageId: msg.id,
        text: msg.text,
        emoji: msg.emoji,
      });

      // Also send as chat message via socket
      const socket = getSocket();
      if (socket) {
        socket.emit("chat:send", {
          to: userId,
          text: `${msg.emoji} ${msg.text}`,
          type: "text",
        });
      }

      setSentHis((prev) => ({ ...prev, [userId]: sent }));
      return sent;
    },
    [sentHis, user?.uid]
  );

  const isLiked = useCallback((userId: string) => !!likedUsers[userId], [likedUsers]);

  const toggleLike = useCallback(
    async (u: { uid: string }): Promise<boolean> => {
      if (!user?.uid) return false;
      const wasLiked = !!likedUsers[u.uid];

      // Optimistic update
      if (wasLiked) {
        setLikedUsers((prev) => {
          const next = { ...prev };
          delete next[u.uid];
          return next;
        });
      } else {
        setLikedUsers((prev) => ({
          ...prev,
          [u.uid]: { uid: u.uid, at: Date.now() },
        }));
      }

      await api.post(`/api/users/me/toggle-like`, { targetUid: u.uid });
      return !wasLiked;
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
