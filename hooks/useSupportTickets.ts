import { useCallback, useEffect, useState } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
import { useAuth } from "@/context/AuthContext";

export type TicketMessage = {
  senderRole: "user" | "admin";
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
};

export type SupportTicketSummary = {
  id: string;
  type: "user" | "post" | "message" | "story" | "support";
  reason: string;
  details: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  unread: number;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SupportTicketDetail = SupportTicketSummary & {
  messages: TicketMessage[];
};

/** Kullanıcının açtığı tüm destek taleplerini (Sorun Bildir + şikayetler) listele */
export function useMyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const d = await api.get<{ reports: SupportTicketSummary[] }>("/api/reports/me");
      setTickets(d.reports || []);
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Admin cevap verdiğinde canlı güncelle
  useEffect(() => {
    if (!user) return;
    const handler = () => { load(); };
    let attached: any = null;
    const attach = () => {
      const s = getSocket();
      if (s && s !== attached) {
        if (attached) attached.off("report:update", handler);
        s.off("report:update", handler);
        s.on("report:update", handler);
        attached = s;
      }
    };
    attach();
    const interval = setInterval(attach, 2000);
    return () => {
      clearInterval(interval);
      if (attached) attached.off("report:update", handler);
    };
  }, [user, load]);

  const totalUnread = tickets.reduce((sum, t) => sum + (t.unread || 0), 0);

  return { tickets, loading, refresh: load, totalUnread };
}

/** Tek talebin detayı + mesajları + gönderme fonksiyonu */
export function useTicket(id: string | null) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) { setTicket(null); setLoading(false); return; }
    try {
      const d = await api.get<SupportTicketDetail>(`/api/reports/${id}`);
      setTicket(d);
      // okundu olarak işaretle
      api.post(`/api/reports/${id}/read`).catch(() => {});
    } catch {}
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Admin canlı cevap verirse mesaj hemen görünsün
  useEffect(() => {
    if (!id || !user) return;
    const handler = (data: any) => {
      if (data?.id !== id) return;
      setTicket((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, data.message],
        status: data.status || prev.status,
      } : prev);
      // hemen okundu işaretle (kullanıcı ekranda)
      api.post(`/api/reports/${id}/read`).catch(() => {});
    };
    let attached: any = null;
    const attach = () => {
      const s = getSocket();
      if (s && s !== attached) {
        if (attached) attached.off("report:update", handler);
        s.off("report:update", handler);
        s.on("report:update", handler);
        attached = s;
      }
    };
    attach();
    const interval = setInterval(attach, 2000);
    return () => {
      clearInterval(interval);
      if (attached) attached.off("report:update", handler);
    };
  }, [id, user]);

  const sendMessage = useCallback(async (text: string) => {
    if (!id || !text.trim()) return;
    // Optimistik
    const msg: TicketMessage = {
      senderRole: "user",
      senderId: user?.uid ?? "",
      senderName: "",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
    try {
      await api.post(`/api/reports/${id}/messages`, { text: text.trim() });
    } catch (e) {
      // Hata olursa optimistik mesajı geri al
      setTicket((prev) => prev ? { ...prev, messages: prev.messages.filter((m) => m !== msg) } : prev);
      throw e;
    }
  }, [id, user]);

  return { ticket, loading, sendMessage, refresh: load };
}
