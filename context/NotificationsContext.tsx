import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
import { useAuth } from "@/context/AuthContext";

export type NotifType =
  | "message" | "like" | "match" | "story_view" | "story_reply"
  | "profile_view" | "hi" | "admin" | "announcement" | "system";

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
  storyId?: string;
  storyImageUrl?: string;
};

type NotificationsContextType = {
  notifications: NotificationData[];
  loading: boolean;
  unreadCount: number;
  markAllRead: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  loading: true,
  unreadCount: 0,
  markAllRead: async () => {},
  markRead: async () => {},
  deleteNotification: async () => {},
  clearAll: async () => {},
  refresh: async () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!uid) return;
    try {
      const list = await api.get<NotificationData[]>("/api/notifications");
      setNotifications(list);
    } catch {}
    finally { setLoading(false); }
  }, [uid]);

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    fetchNotifications();
  }, [fetchNotifications, uid]);

  // Socket dinleyici
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
    const interval = setInterval(attach, 2000);
    return () => {
      clearInterval(interval);
      if (attached) attached.off("notification", handleNotification);
    };
  }, [uid]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await api.post("/api/notifications/read-all").catch(() => {});
  }, []);

  const markRead = useCallback(async (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    await api.post(`/api/notifications/${notifId}/read`).catch(() => {});
  }, []);

  const deleteNotification = useCallback(async (notifId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    await api.delete(`/api/notifications/${notifId}`).catch(() => {});
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    await api.delete("/api/notifications").catch(() => {});
  }, []);

  return (
    <NotificationsContext.Provider value={{
      notifications, loading, unreadCount,
      markAllRead, markRead, deleteNotification, clearAll,
      refresh: fetchNotifications,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
