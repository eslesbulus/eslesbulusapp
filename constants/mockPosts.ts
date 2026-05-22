/**
 * Post types. Data now lives in Firestore `posts` collection.
 * These types kept for component props compatibility.
 */
import type { UserProfile } from "@/context/AuthContext";
import type { Post } from "@/hooks/usePosts";

/** Enriched post for display — post data + author info */
export type DisplayPost = Post & {
  userName: string;
  userPhoto: string;
  userAge?: number;
  userCity?: string;
  verified: boolean;
  vip?: boolean;
};

/** Build enriched posts from raw posts + user map */
export function enrichPosts(
  posts: Post[],
  userMap: Map<string, UserProfile>,
  currentProfile?: UserProfile | null
): DisplayPost[] {
  return posts.map((p) => {
    // Use post author from map; only use currentProfile if the post actually belongs to them
    const u =
      userMap.get(p.userId) ??
      (currentProfile && p.userId === currentProfile.uid ? currentProfile : null);
    return {
      ...p,
      userName: u?.name ?? "Anonim",
      userPhoto: u?.photoURL || u?.photos?.[0] || "",
      userAge: u?.age,
      userCity: u?.city,
      verified: u?.verified ?? false,
      vip: u?.vip ?? false,
    };
  });
}

export function formatTimeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "şimdi";
  if (mins < 60) return `${mins}dk`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}sa`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}g`;
  return `${Math.floor(days / 7)}h`;
}
