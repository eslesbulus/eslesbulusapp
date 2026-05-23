import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
import { useAuth } from "@/context/AuthContext";
import type { Gift } from "@/constants/gifts";

export type StoryReplyData = {
  storyId: string;
  storyImageUrl: string;
  storyOwnerId: string;
  isEmoji: boolean;
};

export type MessageReaction = {
  emoji: string;
  userId: string;
};

export type ChatMessage = {
  id: string;
  _id?: string;
  senderId: string;
  text: string;
  type: "text" | "gift" | "image" | "video" | "sharedPost" | "storyReply";
  createdAt: string | null;
  status: "sent" | "delivered" | "read";
  deleted?: boolean;
  reactions?: MessageReaction[];
  imageUrl?: string | null;
  gift?: Gift;
  storyReply?: StoryReplyData;
  sharedPost?: {
    id: string;
    userId?: string;
    userName: string;
    userPhoto: string;
    text: string;
    image?: string;
  };
};

function makeChatKey(a: string, b: string): string {
  return [a, b].sort().join("_");
}

function formatTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function useChat(otherUid: string) {
  const { user } = useAuth();
  const myUid = user?.uid ?? "";
  const chatKey = myUid && otherUid ? makeChatKey(myUid, otherUid) : "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch messages from API
  useEffect(() => {
    if (!chatKey || !otherUid) { setLoading(false); return; }
    let cancelled = false;

    api.get<any[]>(`/api/chats/${otherUid}/messages`)
      .then((msgs) => {
        if (cancelled) return;
        const mapped: ChatMessage[] = msgs.map((m: any) => ({
          id: m._id || m.id || String(Math.random()),
          senderId: m.senderId,
          text: m.text ?? "",
          type: m.type ?? "text",
          createdAt: m.createdAt ?? null,
          status: m.status ?? "sent",
          deleted: m.deleted ?? false,
          reactions: m.reactions ?? [],
          imageUrl: m.imageUrl ?? null,
          gift: m.gift ?? undefined,
          storyReply: m.storyReply ?? undefined,
          sharedPost: m.sharedPost ?? undefined,
        }));
        setMessages(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Sohbet acildiginda karsi tarafin mesajlarini "read" olarak isaretle
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:read", { chatKey, readerUid: myUid });
    }

    return () => { cancelled = true; };
  }, [chatKey, otherUid]);

  // Listen for real-time messages via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatKey) return;

    const handleMessage = (data: { chatKey: string; message: any }) => {
      if (data.chatKey !== chatKey) return;
      const m = data.message;
      const realId = m._id || m.id || String(Date.now());
      const newMsg: ChatMessage = {
        id: realId,
        senderId: m.senderId,
        text: m.text ?? "",
        type: m.type ?? "text",
        createdAt: m.createdAt ?? new Date().toISOString(),
        status: m.status ?? "sent",
        deleted: m.deleted ?? false,
        reactions: m.reactions ?? [],
        gift: m.gift ?? undefined,
        storyReply: m.storyReply ?? undefined,
        sharedPost: m.sharedPost ?? undefined,
      };

      setMessages((prev) => {
        if (prev.some((p) => p.id === realId)) return prev;

        if (m.senderId === myUid) {
          const pendingIdx = prev.findIndex(
            (p) => p.id.startsWith("pending_") && p.senderId === myUid && p.text === m.text && p.type === (m.type || "text")
          );
          if (pendingIdx >= 0) {
            const updated = [...prev];
            updated[pendingIdx] = newMsg;
            return updated;
          }
        }

        return [...prev, newMsg];
      });

      // Karsi tarafin mesajiysa hemen "read" olarak isaretle
      if (m.senderId !== myUid) {
        socket.emit("chat:read", { chatKey, readerUid: myUid });
      }
    };

    // Herkesten silindi event'i
    const handleDeleted = (data: { chatKey: string; messageIds: string[]; mode: string }) => {
      if (data.chatKey !== chatKey) return;
      if (data.mode === "all") {
        setMessages((prev) =>
          prev.map((m) => {
            if (data.messageIds.includes(m.id)) {
              return { ...m, text: "Bu mesaj silindi", type: "text", deleted: true, gift: undefined, storyReply: undefined, sharedPost: undefined };
            }
            return m;
          })
        );
      }
    };

    // Read receipt — karsi taraf mesajlari okudugunda
    const handleRead = (data: { chatKey: string; readerUid: string }) => {
      if (data.chatKey !== chatKey) return;
      if (data.readerUid !== myUid) {
        // Karsi taraf okudu — benim mesajlarimi "read" yap
        setMessages((prev) =>
          prev.map((m) => m.senderId === myUid && m.status !== "read" ? { ...m, status: "read" } : m)
        );
      }
    };

    // Emoji reaction event — kisi basina tek emoji
    const handleReaction = (data: { chatKey: string; messageId: string; emoji: string; userId: string; remove?: boolean }) => {
      if (data.chatKey !== chatKey) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== data.messageId) return m;
          const existing = m.reactions ?? [];
          if (data.remove) {
            return { ...m, reactions: existing.filter((r) => r.userId !== data.userId) };
          }
          // Eskiyi cikar, yenisini ekle
          const withoutUser = existing.filter((r) => r.userId !== data.userId);
          return { ...m, reactions: [...withoutUser, { emoji: data.emoji, userId: data.userId }] };
        })
      );
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:messages-deleted", handleDeleted);
    socket.on("chat:read", handleRead);
    socket.on("chat:reaction", handleReaction);
    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:messages-deleted", handleDeleted);
      socket.off("chat:read", handleRead);
      socket.off("chat:reaction", handleReaction);
    };
  }, [chatKey, myUid]);

  const sendText = useCallback((text: string) => {
    if (!chatKey || !myUid || !text.trim()) return;
    const trimmed = text.trim();
    const optimistic: ChatMessage = {
      id: `pending_${Date.now()}`,
      senderId: myUid,
      text: trimmed,
      type: "text",
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    setMessages((prev) => [...prev, optimistic]);
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:send", { to: otherUid, text: trimmed, type: "text" });
    } else {
      api.post(`/api/chats/${otherUid}/messages`, { text: trimmed, type: "text" }).catch(() => {});
    }
  }, [chatKey, myUid, otherUid]);

  const sendGift = useCallback((gift: Gift) => {
    if (!chatKey || !myUid) return;
    const optimistic: ChatMessage = {
      id: `pending_${Date.now()}`,
      senderId: myUid,
      text: `🎁 ${gift.name}`,
      type: "gift",
      createdAt: new Date().toISOString(),
      status: "sent",
      gift: { name: gift.name, emoji: gift.emoji, price: gift.price, color: gift.color } as Gift,
    };
    setMessages((prev) => [...prev, optimistic]);
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:send", { to: otherUid, text: `🎁 ${gift.name}`, type: "gift", gift: { name: gift.name, emoji: gift.emoji, price: gift.price, color: gift.color } });
    }
  }, [chatKey, myUid, otherUid]);

  const sendImage = useCallback((label: string) => {
    if (!chatKey || !myUid) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:send", { to: otherUid, text: label, type: "image" });
    }
  }, [chatKey, myUid, otherUid]);

  const sendSharedPost = useCallback((post: ChatMessage["sharedPost"]) => {
    if (!chatKey || !myUid || !post) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:send", { to: otherUid, text: "", type: "sharedPost", sharedPost: post });
    }
  }, [chatKey, myUid, otherUid]);

  const reactToMessage = useCallback((messageId: string, emoji: string) => {
    if (!chatKey || !myUid) return;
    // Optimistic update — kisi basina tek emoji
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions ?? [];
        const myExisting = existing.find((r) => r.userId === myUid);
        if (myExisting && myExisting.emoji === emoji) {
          // Ayni emoji — kaldir (toggle)
          return { ...m, reactions: existing.filter((r) => r.userId !== myUid) };
        }
        // Farkli emoji veya yeni — eskiyi cikar, yenisini ekle
        const withoutMine = existing.filter((r) => r.userId !== myUid);
        return { ...m, reactions: [...withoutMine, { emoji, userId: myUid }] };
      })
    );
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:reaction", { chatKey, messageId, emoji, userId: myUid });
    }
  }, [chatKey, myUid]);

  return {
    messages,
    loading,
    sendText,
    sendGift,
    sendImage,
    sendSharedPost,
    reactToMessage,
    myUid,
    chatId: chatKey,
    formatTime,
  };
}
