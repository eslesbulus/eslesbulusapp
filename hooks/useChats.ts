import { useState, useEffect, useCallback, useRef } from "react";
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
  unreadCount: number;
  archived?: boolean;
};

// ── Global shared state ──────────────────────────────────
let _globalChats: ChatPreviewData[] = [];
let _globalArchivedChats: ChatPreviewData[] = [];
let _globalLoading = true;
let _activeChatOtherUid: string | null = null; // su an icinde olunan sohbet
const _listeners = new Set<() => void>();

function _notifyAll() {
  _listeners.forEach((fn) => fn());
}

function _setGlobalChats(updater: ChatPreviewData[] | ((prev: ChatPreviewData[]) => ChatPreviewData[])) {
  if (typeof updater === "function") {
    _globalChats = updater(_globalChats);
  } else {
    _globalChats = updater;
  }
  _notifyAll();
}

function _setArchivedChats(updater: ChatPreviewData[] | ((prev: ChatPreviewData[]) => ChatPreviewData[])) {
  if (typeof updater === "function") {
    _globalArchivedChats = updater(_globalArchivedChats);
  } else {
    _globalArchivedChats = updater;
  }
  _notifyAll();
}

function _sortByTime(list: ChatPreviewData[]): ChatPreviewData[] {
  return [...list].sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });
}

/** Chat ekrani acikken cagir — o sohbetin mesajlari unread olarak sayilmaz */
export function setActiveChat(otherUid: string | null) {
  _activeChatOtherUid = otherUid;
}

// ── Hook ─────────────────────────────────────────────────

export function useChats() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [, forceUpdate] = useState(0);
  const fetchedRef = useRef(false);

  // Subscribe to global state changes
  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  // Fetch chats from API
  useEffect(() => {
    if (!uid) { _globalLoading = false; return; }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Normal sohbetler
    api.get<any[]>("/api/chats")
      .then((list) => {
        const mapped: ChatPreviewData[] = list.map((c) => {
          const otherUid = (c.participants as string[]).find((p) => p !== uid) ?? "";
          return {
            chatId: c._id,
            chatKey: c.chatKey,
            otherUid,
            lastMessage: c.lastMessage ?? "",
            lastMessageAt: c.lastMessageAt ?? null,
            lastSenderId: c.lastSenderId ?? "",
            unreadCount: c.unreadCount ?? 0,
          };
        });
        _globalChats = _sortByTime(mapped);
        _globalLoading = false;
        _notifyAll();
      })
      .catch(() => { _globalLoading = false; _notifyAll(); });

    // Arsivlenmis sohbetler
    api.get<any[]>("/api/chats/archived")
      .then((list) => {
        const mapped: ChatPreviewData[] = list.map((c) => {
          const otherUid = (c.participants as string[]).find((p) => p !== uid) ?? "";
          return {
            chatId: c._id,
            chatKey: c.chatKey,
            otherUid,
            lastMessage: c.lastMessage ?? "",
            lastMessageAt: c.lastMessageAt ?? null,
            lastSenderId: c.lastSenderId ?? "",
            unreadCount: c.unreadCount ?? 0,
            archived: true,
          };
        });
        _globalArchivedChats = _sortByTime(mapped);
        _notifyAll();
      })
      .catch(() => {});
  }, [uid]);

  // Listen for new messages → update chat list
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !uid) return;

    const handleMessage = (data: { chatKey: string; message: any; unreadCount?: number }) => {
      _setGlobalChats((prev) => {
        const idx = prev.findIndex((c) => c.chatKey === data.chatKey);
        const otherUid = data.chatKey.split("_").find((p) => p !== uid) ?? "";
        const existing = idx >= 0 ? prev[idx] : null;

        // Eger su an bu sohbetin icindeyse unread her zaman 0
        const isInActiveChat = _activeChatOtherUid === otherUid;

        // Sunucudan gelen gercek unread degerini kullan (cift saymayi onler)
        const serverUnread = data.unreadCount ?? 0;

        const updated: ChatPreviewData = {
          chatId: existing?.chatId ?? data.chatKey,
          chatKey: data.chatKey,
          otherUid,
          lastMessage: data.message.text || "",
          lastMessageAt: data.message.createdAt,
          lastSenderId: data.message.senderId,
          unreadCount: isInActiveChat ? 0 : serverUnread,
        };
        const next = idx >= 0
          ? prev.map((c, i) => (i === idx ? updated : c))
          : [updated, ...prev];
        return _sortByTime(next);
      });
    };

    socket.on("chat:message", handleMessage);
    return () => { socket.off("chat:message", handleMessage); };
  }, [uid]);

  const markRead = useCallback((otherUid: string) => {
    _setGlobalChats((prev) =>
      prev.map((c) => (c.otherUid === otherUid ? { ...c, unreadCount: 0 } : c))
    );
    api.post(`/api/chats/${otherUid}/read`).catch(() => {});
  }, []);

  const deleteChat = useCallback(async (otherUid: string) => {
    _setGlobalChats((prev) => prev.filter((c) => c.otherUid !== otherUid));
    _setArchivedChats((prev) => prev.filter((c) => c.otherUid !== otherUid));
    await api.delete(`/api/chats/${otherUid}`).catch(() => {});
  }, []);

  const archiveChat = useCallback(async (otherUid: string) => {
    const chat = _globalChats.find((c) => c.otherUid === otherUid);
    _setGlobalChats((prev) => prev.filter((c) => c.otherUid !== otherUid));
    if (chat) {
      _setArchivedChats((prev) => _sortByTime([{ ...chat, archived: true }, ...prev]));
    }
    await api.post(`/api/chats/${otherUid}/archive`).catch(() => {});
  }, []);

  const unarchiveChat = useCallback(async (otherUid: string) => {
    const chat = _globalArchivedChats.find((c) => c.otherUid === otherUid);
    _setArchivedChats((prev) => prev.filter((c) => c.otherUid !== otherUid));
    if (chat) {
      _setGlobalChats((prev) => _sortByTime([{ ...chat, archived: false }, ...prev]));
    }
    await api.post(`/api/chats/${otherUid}/unarchive`).catch(() => {});
  }, []);

  const markReadBulk = useCallback((otherUids: string[]) => {
    const set = new Set(otherUids);
    _setGlobalChats((prev) =>
      prev.map((c) => (set.has(c.otherUid) ? { ...c, unreadCount: 0 } : c))
    );
    otherUids.forEach((uid) => api.post(`/api/chats/${uid}/read`).catch(() => {}));
  }, []);

  const deleteBulk = useCallback(async (otherUids: string[]) => {
    const set = new Set(otherUids);
    _setGlobalChats((prev) => prev.filter((c) => !set.has(c.otherUid)));
    await Promise.all(otherUids.map((uid) => api.delete(`/api/chats/${uid}`).catch(() => {})));
  }, []);

  const archiveBulk = useCallback(async (otherUids: string[]) => {
    const set = new Set(otherUids);
    const toArchive = _globalChats.filter((c) => set.has(c.otherUid));
    _setGlobalChats((prev) => prev.filter((c) => !set.has(c.otherUid)));
    _setArchivedChats((prev) =>
      _sortByTime([...toArchive.map((c) => ({ ...c, archived: true })), ...prev])
    );
    await Promise.all(otherUids.map((uid) => api.post(`/api/chats/${uid}/archive`).catch(() => {})));
  }, []);

  const totalUnreadChats = _globalChats.filter((c) => c.unreadCount > 0).length;

  return {
    chats: _globalChats,
    archivedChats: _globalArchivedChats,
    loading: _globalLoading,
    markRead,
    markReadBulk,
    deleteChat,
    deleteBulk,
    archiveChat,
    archiveBulk,
    unarchiveChat,
    totalUnreadChats,
  };
}
