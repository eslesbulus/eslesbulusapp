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
  | "hi";

export type NotificationData = {
  id: string;
  type: NotifType;
  fromUid: string;
  fromName: string;
  fromPhoto: string;
  text: string;
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
  const [unreadCount, setUnreadCount] = useState(0);

  // API'den bildirimleri çek
  const fetchNotifications = useCallback(async () => {
    if (!uid) return;
    try {
      const list = await api.get<NotificationData[]>("/api/notifications");
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Socket üzerinden gerçek zamanlı bildirim dinle
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !uid) return;

    const handleNotification = (data: NotificationData) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("notification", handleNotification);
    return () => {
      socket.off("notification", handleNotification);
    };
  }, [uid]);

  // Tüm bildirimleri okundu işaretle
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await api.post("/api/notifications/read-all").catch(() => {});
  }, []);

  // Tek bildirimi okundu işaretle
  const markRead = useCallback(async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await api.post(`/api/notifications/${notifId}/read`).catch(() => {});
  }, []);

  return {
    notifications,
    loading,
    unreadCount,
    markAllRead,
    markRead,
    refresh: fetchNotifications,
  };
}
