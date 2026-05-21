// Notifications backend is pending. Until a real `notifications/{uid}` collection
// is created, this file exposes the type contract and an empty list so
// downstream consumers compile and render gracefully ("Henüz bildirim yok").

export type NotifType = "hi" | "match" | "story_view" | "profile_view" | "like";

export type Notif = {
  id: string;
  type: NotifType;
  userId: string;
  time: string;
  read: boolean;
};

export const MOCK_NOTIFS: Notif[] = [];

export function notifLabel(t: NotifType): { text: string; icon: string; color?: string } {
  switch (t) {
    case "hi":
      return { text: "sana Hi gönderdi", icon: "hand-right" };
    case "match":
      return { text: "ile eşleştin! 🎉", icon: "heart" };
    case "story_view":
      return { text: "hikayene baktı", icon: "eye" };
    case "profile_view":
      return { text: "profiline baktı", icon: "person" };
    case "like":
      return { text: "profilini beğendi", icon: "thumbs-up" };
  }
}
