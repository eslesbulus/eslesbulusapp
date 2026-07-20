import type { TranslationKeys } from "@/i18n/tr";

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

export type Notif = {
  id: string;
  type: NotifType;
  fromUid: string;
  fromName: string;
  fromPhoto: string;
  text: string;
  read: boolean;
  createdAt: string;
  storyId?: string;
  storyImageUrl?: string;
};

const NOTIF_KEY_MAP: Record<string, { key: TranslationKeys; icon: string }> = {
  message: { key: "notif_message", icon: "chatbubble" },
  like: { key: "notif_like", icon: "heart" },
  match: { key: "notif_match", icon: "heart-circle" },
  story_view: { key: "notif_story_view", icon: "eye" },
  story_reply: { key: "notif_story_reply", icon: "arrow-undo" },
  profile_view: { key: "notif_profile_view", icon: "person" },
  hi: { key: "notif_hi", icon: "hand-right" },
  admin: { key: "notif_announcement", icon: "megaphone" },
  announcement: { key: "notif_announcement", icon: "megaphone" },
  system: { key: "notif_announcement", icon: "megaphone" },
};

export function notifLabel(
  type: NotifType,
  t?: (key: TranslationKeys) => string
): { text: string; icon: string } {
  const entry = NOTIF_KEY_MAP[type];
  if (!entry) return { text: "", icon: "notifications" };
  return { text: t ? t(entry.key) : entry.key, icon: entry.icon };
}

export function formatNotifTime(
  ts: string,
  t?: (key: TranslationKeys) => string
): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t ? t("time_now") : "time_now";
  if (mins < 60) return `${mins} ${t ? t("time_min") : "dk"}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t ? t("time_hour") : "sa"}`;
  const days = Math.floor(hours / 24);
  if (days === 1) return t ? t("time_yesterday") : "time_yesterday";
  if (days < 7) return `${days} ${t ? t("time_days") : "gün"}`;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}
