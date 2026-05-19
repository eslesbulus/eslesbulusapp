import { MOCK_USERS } from "./mockUsers";

export type NotifType = "hi" | "match" | "story_view" | "profile_view" | "like";

export type Notif = {
  id: string;
  type: NotifType;
  userId: string;
  time: string;
  read: boolean;
};

export const MOCK_NOTIFS: Notif[] = [
  { id: "n1", type: "match", userId: "u3", time: "şimdi", read: false },
  { id: "n2", type: "hi", userId: "u7", time: "5 dk", read: false },
  { id: "n3", type: "story_view", userId: "u1", time: "12 dk", read: false },
  { id: "n4", type: "profile_view", userId: "u9", time: "1 sa", read: true },
  { id: "n5", type: "like", userId: "u11", time: "2 sa", read: true },
  { id: "n6", type: "hi", userId: "u2", time: "3 sa", read: true },
  { id: "n7", type: "profile_view", userId: "u5", time: "5 sa", read: true },
  { id: "n8", type: "story_view", userId: "u6", time: "dün", read: true },
];

export function getNotifUser(n: Notif) {
  return MOCK_USERS.find((u) => u.id === n.userId);
}

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
