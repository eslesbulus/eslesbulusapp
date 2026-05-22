import { useState, useEffect } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
import { useAuth } from "@/context/AuthContext";

export type ChatPreviewData = {
  chatId: string;
  chatKey: string;
  otherUid: string;
  lastMessage: string;
  lastMessageAt: string | null;
  lastSenderId: string;
};

export function useChats() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [chats, setChats] = useState<ChatPreviewData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch chats from API
  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    let cancelled = false;

    api.get<any[]>("/api/chats")
      .then((list) => {
        if (cancelled) return;
        const mapped: ChatPreviewData[] = list.map((c) => {
          const otherUid = (c.participants as string[]).find((p) => p !== uid) ?? "";
          return {
            chatId: c._id,
            chatKey: c.chatKey,
            otherUid,
            lastMessage: c.lastMessage ?? "",
            lastMessageAt: c.lastMessageAt ?? null,
            lastSenderId: c.lastSenderId ?? "",
          };
        });
        mapped.sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        });
        setChats(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, [uid]);

  // Listen for new messages → update chat list
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !uid) return;

    const handleMessage = (data: { chatKey: string; message: any }) => {
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.chatKey === data.chatKey);
        const otherUid = data.chatKey.split("_").find((p) => p !== uid) ?? "";
        const updated: ChatPreviewData = {
          chatId: idx >= 0 ? prev[idx].chatId : data.chatKey,
          chatKey: data.chatKey,
          otherUid,
          lastMessage: data.message.text || "",
          lastMessageAt: data.message.createdAt,
          lastSenderId: data.message.senderId,
        };
        const next = idx >= 0
          ? prev.map((c, i) => i === idx ? updated : c)
          : [updated, ...prev];
        // Re-sort
        next.sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        });
        return next;
      });
    };

    socket.on("chat:message", handleMessage);
    return () => { socket.off("chat:message", handleMessage); };
  }, [uid]);

  return { chats, loading };
}
