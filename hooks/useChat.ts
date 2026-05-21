import { useState, useEffect, useCallback } from "react";
import {
  collection,
  doc,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  limit,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import type { Gift } from "@/constants/gifts";

/* ── Firestore schema ──
   chats/{chatId}                → { participants: [uidA, uidB], lastMessage, lastMessageAt, ... }
   chats/{chatId}/messages/{id}  → ChatMessage
   chatId = sorted uids joined by "_"
*/

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  type: "text" | "gift" | "image" | "sharedPost";
  createdAt: Timestamp | null;
  status: "sent" | "delivered" | "read";
  // gift
  gift?: Gift;
  // shared post
  sharedPost?: {
    id: string;
    userName: string;
    userPhoto: string;
    text: string;
    image?: string;
  };
};

function makeChatId(a: string, b: string): string {
  return [a, b].sort().join("_");
}

function formatTime(ts: Timestamp | null): string {
  if (!ts) return "";
  const d = ts.toDate();
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export function useChat(otherUid: string) {
  const { user } = useAuth();
  const myUid = user?.uid ?? "";
  const chatId = myUid && otherUid ? makeChatId(myUid, otherUid) : "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener
  useEffect(() => {
    if (!chatId) { setLoading(false); return; }

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ChatMessage[];
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
      console.error("[useChat] snapshot error:", err);
      setLoading(false);
    });

    return unsub;
  }, [chatId]);

  // Mark incoming messages as read
  useEffect(() => {
    if (!chatId || !myUid) return;
    // Find unread messages from the other party and mark as read
    const unread = messages.filter(
      (m) => m.senderId !== myUid && m.status !== "read"
    );
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((m) => {
      batch.update(doc(db, "chats", chatId, "messages", m.id), { status: "read" });
    });
    batch.commit().catch((e) => console.warn("[useChat] mark read error:", e));
  }, [messages, chatId, myUid]);

  const sendText = useCallback(async (text: string) => {
    if (!chatId || !myUid || !text.trim()) return;

    // Ensure chat doc exists (upsert participants)
    const chatRef = doc(db, "chats", chatId);
    // We write the chat meta alongside the message
    // Using setDoc with merge would be cleaner but addDoc for messages
    const { setDoc } = await import("firebase/firestore");
    await setDoc(chatRef, {
      participants: [myUid, otherUid].sort(),
      lastMessage: text.trim(),
      lastMessageAt: serverTimestamp(),
      lastSenderId: myUid,
    }, { merge: true });

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: myUid,
      text: text.trim(),
      type: "text",
      createdAt: serverTimestamp(),
      status: "sent",
    });
  }, [chatId, myUid, otherUid]);

  const sendGift = useCallback(async (gift: Gift) => {
    if (!chatId || !myUid) return;

    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, {
      participants: [myUid, otherUid].sort(),
      lastMessage: `🎁 ${gift.name}`,
      lastMessageAt: serverTimestamp(),
      lastSenderId: myUid,
    }, { merge: true });

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: myUid,
      text: `🎁 ${gift.name}`,
      type: "gift",
      gift: { name: gift.name, emoji: gift.emoji, price: gift.price, color: gift.color },
      createdAt: serverTimestamp(),
      status: "sent",
    });
  }, [chatId, myUid, otherUid]);

  const sendImage = useCallback(async (label: string) => {
    if (!chatId || !myUid) return;

    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, {
      participants: [myUid, otherUid].sort(),
      lastMessage: label,
      lastMessageAt: serverTimestamp(),
      lastSenderId: myUid,
    }, { merge: true });

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: myUid,
      text: label,
      type: "image",
      createdAt: serverTimestamp(),
      status: "sent",
    });
  }, [chatId, myUid, otherUid]);

  const sendSharedPost = useCallback(async (post: ChatMessage["sharedPost"]) => {
    if (!chatId || !myUid || !post) return;

    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, {
      participants: [myUid, otherUid].sort(),
      lastMessage: "Gönderi paylaşıldı",
      lastMessageAt: serverTimestamp(),
      lastSenderId: myUid,
    }, { merge: true });

    await addDoc(collection(db, "chats", chatId, "messages"), {
      senderId: myUid,
      text: "",
      type: "sharedPost",
      sharedPost: post,
      createdAt: serverTimestamp(),
      status: "sent",
    });
  }, [chatId, myUid, otherUid]);

  return {
    messages,
    loading,
    sendText,
    sendGift,
    sendImage,
    sendSharedPost,
    myUid,
    chatId,
    formatTime,
  };
}
