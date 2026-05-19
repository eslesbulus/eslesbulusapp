import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { HI_MESSAGES } from "@/constants/messageTemplates";

export type SentHi = {
  userId: string;
  messageId: string;
  text: string;
  emoji: string;
  at: number;
};

type Ctx = {
  sentHis: Record<string, SentHi>;
  hasSent: (userId: string) => boolean;
  sendRandomHi: (userId: string) => SentHi;
};

const InteractionsContext = createContext<Ctx | null>(null);

export function InteractionsProvider({ children }: { children: React.ReactNode }) {
  const [sentHis, setSentHis] = useState<Record<string, SentHi>>({});

  const hasSent = useCallback((id: string) => !!sentHis[id], [sentHis]);

  const sendRandomHi = useCallback((userId: string): SentHi => {
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
    setSentHis((prev) => ({ ...prev, [userId]: sent }));
    return sent;
  }, [sentHis]);

  const value = useMemo(() => ({ sentHis, hasSent, sendRandomHi }), [sentHis, hasSent, sendRandomHi]);

  return (
    <InteractionsContext.Provider value={value}>{children}</InteractionsContext.Provider>
  );
}

export function useInteractions() {
  const ctx = useContext(InteractionsContext);
  if (!ctx) throw new Error("useInteractions outside provider");
  return ctx;
}
