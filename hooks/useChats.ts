import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

export type ChatPreviewData = {
  chatId: string;
  otherUid: string;
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  lastSenderId: string;
};

export function useChats() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [chats, setChats] = useState<ChatPreviewData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    // Only filter by participants — sort client-side to avoid composite index requirement
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", uid),
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: ChatPreviewData[] = snap.docs.map((d) => {
        const data = d.data();
        const participants: string[] = data.participants ?? [];
        const otherUid = participants.find((p: string) => p !== uid) ?? "";
        return {
          chatId: d.id,
          otherUid,
          lastMessage: data.lastMessage ?? "",
          lastMessageAt: data.lastMessageAt ?? null,
          lastSenderId: data.lastSenderId ?? "",
        };
      });
      // Sort by most recent first (client-side)
      list.sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis() ?? 0;
        const tb = b.lastMessageAt?.toMillis() ?? 0;
        return tb - ta;
      });
      setChats(list);
      setLoading(false);
    }, (err) => {
      console.error("[useChats] snapshot error:", err);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  return { chats, loading };
}
