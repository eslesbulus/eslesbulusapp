import { useState, useEffect, useCallback } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
import { useAuth } from "@/context/AuthContext";
import type { Gift } from "@/constants/gifts";

export type ChatMessage = {
  id: string;
  _id?: string;
  senderId: string;
  text: string;
  type: "text" | "gift" | "image" | "sharedPost";
  createdAt: string | null;
  status: "sent" | "delivered" | "read";
  gift?: Gift;
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
          gift: m.gift ?? undefined,
          sharedPost: m.sharedPost ?? undefined,
        }));
        setMessages(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, [chatKey, otherUid]);

  // Listen for real-time messages via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !chatKey) return;

    const handleMessage = (data: { chatKey: string; message: any }) => {
      if (data.chatKey !== chatKey) return;
      const m = data.message;
      const newMsg: ChatMessage = {
        id: m._id || m.id || String(Date.now()),
        senderId: m.senderId,
        text: m.text ?? "",
        type: m.type ?? "text",
        createdAt: m.createdAt ?? new Date().toISOString(),
        status: m.status ?? "sent",
        gift: m.gift ?? undefined,
        sharedPost: m.sharedPost ?? undefined,
      };
      setMessages((prev) => {
        if (prev.some((p) => p.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    };

    socket.on("chat:message", handleMessage);
    return () => { socket.off("chat:message", handleMessage); };
  }, [chatKey]);

  const sendText = useCallback(async (text: string) => {
    if (!chatKey || !myUid || !text.trim()) return;

    const optimistic: ChatMessage = {
      id: `pending_${Date.now()}`,
      senderId: myUid,
      text: text.trim(),
      type: "text",
      createdAt: new Date().toISOString(),
      status: "sent",
    };
    setMessages((prev) => [...prev, optimistic]);

    const socket = getSocket();
    if (socket) {
      socket.emit("chat:send", {
        to: otherUid,
        text: text.trim(),
        type: "text",
      });
    }
  }, [chatKey, myUid, otherUid]);

  const sendGift = useCallback(async (gift: Gift) => {
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
    if (socket) {
      socket.emit("chat:send", {
        to: otherUid,
        text: `🎁 ${gift.name}`,
        type: "gift",
        gift: { name: gift.name, emoji: gift.emoji, price: gift.price, color: gift.color },
      });
    }
  }, [chatKey, myUid, otherUid]);

  const sendImage = useCallback(async (label: string) => {
    if (!chatKey || !myUid) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("chat:send", { to: otherUid, text: label, type: "image" });
    }
  }, [chatKey, myUid, otherUid]);

  const sendSharedPost = useCallback(async (post: ChatMessage["sharedPost"]) => {
    if (!chatKey || !myUid || !post) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("chat:send", { to: otherUid, text: "", type: "sharedPost", sharedPost: post });
    }
  }, [chatKey, myUid, otherUid]);

  return {
    messages,
    loading,
    sendText,
    sendGift,
    sendImage,
    sendSharedPost,
    myUid,
    chatId: chatKey,
    formatTime,
  };
}
