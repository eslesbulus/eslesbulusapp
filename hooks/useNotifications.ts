import { useState, useEffect, useCallback } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
import { useAuth } from "@/context/AuthContext";

export type NotifType =
  | "message"
  | "like"
  | "match"
  | "story_view"
  | "story_reply"
  | "profile_view"
  | "hi"
  | "admin"
  | "announcement"
  | "system";

export type NotificationData = {
  id: string;
  type: NotifType;
  fromUid: string;
  fromName: string;
  fromPhoto: string;
  text: string;
  title?: string;
  read: boolean;
  createdAt: string;
  // Optional metadata
  storyId?: string;
  storyImageUrl?: string;
};

export function useNotifications() {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  // unreadCount her zaman listeden türetilir — tek kaynak
  const unreadCount = notifications.filter((n) => !n.read).length;

  // API'den bildirimleri çek
  const fetchNotifications = useCallback(async () => {
    if (!uid) return;
    try {
      const list = await api.get<NotificationData[]>("/api/notifications");
      setNotifications(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket üzerinden gerçek zamanlı bildirim dinle.
  // ÖNEMLİ: socket auth sonrası bağlandığı için ilk render'da null olabilir;
  // bağlanınca / yeniden bağlanınca dinleyiciyi tekrar ekle.
  useEffect(() => {
    if (!uid) return;

    const handleNotification = (data: NotificationData) => {
      setNotifications((prev) => (prev.some((n) => n.id === data.id) ? prev : [data, ...prev]));
    };

    let attached: any = null;
    const attach = () => {
      const s = getSocket();
      if (s && s !== attached) {
        if (attached) attached.off("notification", handleNotification);
        s.off("notification", handleNotification);
        s.on("notification", handleNotification);
        attached = s;
      }
    };

    attach();
    // Socket henüz hazır değilse veya yeni instance oluşursa yakala
    const interval = setInterval(attach, 2000);

    return () => {
      clearInterval(interval);
      if (attached) attached.off("notification", handleNotification);
    };
  }, [uid]);

  // Tüm bildirimleri okundu işaretle
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await api.post("/api/notifications/read-all").catch(() => {});
  }, []);

  // Tek bildirimi okundu işaretle
  const markRead = useCallback(async (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    await api.post(`/api/notifications/${notifId}/read`).catch(() => {});
  }, []);

  // Tek bildirimi sil
  const deleteNotification = useCallback(async (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    await api.delete(`/api/notifications/${notifId}`).catch(() => {});
  }, []);

  // Tüm bildirimleri sil
  const clearAll = useCallback(async () => {
    setNotifications([]);
    await api.delete("/api/notifications").catch(() => {});
  }, []);

  return {
    notifications,
    loading,
    unreadCount,
    markAllRead,
    markRead,
    deleteNotification,
    clearAll,
    refresh: fetchNotifications,
  };
}
