/**
 * Basit in-memory store: kullanıcı başına paylaşılan gönderileri tutar.
 * Firebase'e bağlandığında bu Firestore mesajları ile değiştirilecek.
 */

export type SharedPostEntry = {
  id: string;
  postId: string;
  userName: string;
  userPhoto: string;
  text: string;
  image?: string;
  sentAt: string; // HH:MM formatı
};

// userId → paylaşılan gönderiler listesi
const store = new Map<string, SharedPostEntry[]>();

export function addSharedPost(toUserId: string, entry: SharedPostEntry) {
  const existing = store.get(toUserId) ?? [];
  store.set(toUserId, [...existing, entry]);
}

export function getSharedPosts(forUserId: string): SharedPostEntry[] {
  return store.get(forUserId) ?? [];
}

export function clearSharedPosts(forUserId: string) {
  store.delete(forUserId);
}
