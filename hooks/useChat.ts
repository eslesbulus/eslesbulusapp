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

export type ReplyToData = {
  messageId: string;
  senderId: string;
  text: string;
  type: string;
};

export type ChatMessage = {
  id: string;
  _id?: string;
  senderId: string;
  text: string;
  type: "text" | "gift" | "image" | "video" | "audio" | "sharedPost" | "storyReply";
  createdAt: string | null;
  status: "sent" | "delivered" | "read";
  deleted?: boolean;
  reactions?: MessageReaction[];
  imageUrl?: string | null;
  audioUrl?: string | null;
  audioDuration?: number; // milisaniye
  replyTo?: ReplyToData | null;
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
  const [hasMore, setHasMore] = useState(true);
  const loadingMoreRef = useRef(false);
  const PAGE_SIZE = 50;

  function mapMsg(m: any): ChatMessage {
    return {
      id: m._id || m.id || String(Math.random()),
      senderId: m.senderId,
      text: m.text ?? "",
      type: m.type ?? "text",
      createdAt: m.createdAt ?? null,
      status: m.status ?? "sent",
      deleted: m.deleted ?? false,
      reactions: m.reactions ?? [],
      imageUrl: m.imageUrl ?? null,
      audioUrl: m.audioUrl ?? null,
      audioDuration: m.audioDuration ?? 0,
      replyTo: m.replyTo ?? null,
      gift: m.gift ?? undefined,
      storyReply: m.storyReply ?? undefined,
      sharedPost: m.sharedPost ?? undefined,
    };
  }

  useEffect(() => {
    if (!chatKey || !otherUid) { setLoading(false); return; }
    let cancelled = false;

    api.get<any[]>(`/api/chats/${otherUid}/messages?limit=${PAGE_SIZE}`)
      .then((msgs) => {
        if (cancelled) return;
        const mapped = msgs.map(mapMsg);
        setMessages(mapped);
        setHasMore(msgs.length >= PAGE_SIZE);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:read", { chatKey, readerUid: myUid });
    }

    return () => { cancelled = true; };
  }, [chatKey, otherUid]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMoreRef.current || !otherUid || messages.length === 0) return;
    loadingMoreRef.current = true;
    try {
      const oldest = messages[0];
      const before = oldest?.createdAt ?? "";
      const older = await api.get<any[]>(`/api/chats/${otherUid}/messages?limit=${PAGE_SIZE}&before=${encodeURIComponent(before)}`);
      if (older.length > 0) {
        const mapped = older.map(mapMsg);
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newMsgs = mapped.filter((m) => !existingIds.has(m.id));
          return [...newMsgs, ...prev];
        });
      }
      setHasMore(older.length >= PAGE_SIZE);
    } catch {}
    loadingMoreRef.current = false;
  }, [hasMore, otherUid, messages]);

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
        imageUrl: m.imageUrl ?? null,
        audioUrl: m.audioUrl ?? null,
        audioDuration: m.audioDuration ?? 0,
        replyTo: m.replyTo ?? null,
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

  // Typing indicator
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmit = useRef(0);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatKey) return;
    const handleTyping = (data: { from: string }) => {
      if (data.from === otherUid) {
        setIsOtherTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
      }
    };
    socket.on("chat:typing", handleTyping);
    return () => {
      socket.off("chat:typing", handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [chatKey, otherUid]);

  const emitTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingEmit.current < 2000) return; // 2sn throttle
    lastTypingEmit.current = now;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:typing", { to: otherUid });
    }
  }, [otherUid]);

  const sendText = useCallback((text: string, replyTo?: ReplyToData | null) => {
    if (!chatKey || !myUid || !text.trim()) return;
    const trimmed = text.trim();
    const optimistic: ChatMessage = {
      id: `pending_${Date.now()}`,
      senderId: myUid,
      text: trimmed,
      type: "text",
      createdAt: new Date().toISOString(),
      status: "sent",
      replyTo: replyTo || null,
    };
    setMessages((prev) => [...prev, optimistic]);
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("chat:send", { to: otherUid, text: trimmed, type: "text", replyTo: replyTo || null });
    } else {
      api.post(`/api/chats/${otherUid}/messages`, { text: trimmed, type: "text", replyTo: replyTo || null }).catch(() => {});
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

  const sendImage = useCallback(async (uri: string, mediaType: "image" | "video" = "image") => {
    if (!chatKey || !myUid) return;
    const label = mediaType === "video" ? "🎥 Video" : "📷 Fotoğraf";
    // Optimistic mesaj
    const optimistic: ChatMessage = {
      id: `pending_${Date.now()}`,
      senderId: myUid,
      text: label,
      type: mediaType,
      createdAt: new Date().toISOString(),
      status: "sent",
      imageUrl: uri, // local uri goster yuklenirken
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      // Yukle — dogru MIME type icin medya turunu gec
      const uploaded = await api.upload("chat", uri, mediaType);
      // Socket ile gonder
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("chat:send", {
          to: otherUid,
          text: label,
          type: mediaType,
          imageUrl: uploaded.url,
        });
      } else {
        await api.post(`/api/chats/${otherUid}/messages`, {
          text: label,
          type: mediaType,
          imageUrl: uploaded.url,
        });
      }
    } catch (err) {
      // Hata durumunda optimistic mesaji kaldir
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      console.error("sendImage error:", err);
    }
  }, [chatKey, myUid, otherUid]);

  const sendVoice = useCallback(async (uri: string, durationMillis: number) => {
    if (!chatKey || !myUid) return;
    const label = "🎤 Sesli mesaj";
    const optimistic: ChatMessage = {
      id: `pending_${Date.now()}`,
      senderId: myUid,
      text: label,
      type: "audio",
      createdAt: new Date().toISOString(),
      status: "sent",
      audioUrl: uri, // local uri — yuklenirken oynatilabilir
      audioDuration: durationMillis,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const uploaded = await api.upload("chat", uri, "audio");
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("chat:send", {
          to: otherUid,
          text: label,
          type: "audio",
          audioUrl: uploaded.url,
          audioDuration: durationMillis,
        });
      } else {
        await api.post(`/api/chats/${otherUid}/messages`, {
          text: label,
          type: "audio",
          audioUrl: uploaded.url,
          audioDuration: durationMillis,
        });
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      console.error("sendVoice error:", err);
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
    sendVoice,
    sendSharedPost,
    reactToMessage,
    emitTyping,
    isOtherTyping,
    myUid,
    chatId: chatKey,
    formatTime,
  };
}
