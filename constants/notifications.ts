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

export function notifLabel(t: NotifType): { text: string; icon: string } {
  switch (t) {
    case "message":
      return { text: "sana mesaj gönderdi", icon: "chatbubble" };
    case "like":
      return { text: "profilini beğendi", icon: "heart" };
    case "match":
      return { text: "ile eşleştin!", icon: "heart-circle" };
    case "story_view":
      return { text: "hikayene baktı", icon: "eye" };
    case "story_reply":
      return { text: "hikayene yanıt verdi", icon: "arrow-undo" };
    case "profile_view":
      return { text: "profiline baktı", icon: "person" };
    case "hi":
      return { text: "sana Hi gönderdi", icon: "hand-right" };
    case "admin":
    case "announcement":
    case "system":
      return { text: "📢 Duyuru", icon: "megaphone" };
    default:
      return { text: "", icon: "notifications" };
  }
}

export function formatNotifTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins} dk`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "dün";
  if (days < 7) return `${days} gün`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
