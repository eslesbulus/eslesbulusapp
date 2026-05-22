import { useEffect, useState, useMemo, useCallback } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

export type Story = {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  createdAt: Date;
  expiresAt: Date;
};

/**
 * Real-time subscription to active stories.
 * Filters expired stories client-side.
 * Returns grouped data + CRUD methods.
 */
export function useStories() {
  const { user } = useAuth();
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = new Date();
        const list: Story[] = [];
        snap.forEach((d) => {
          const data = d.data();
          const expiresAt = data.expiresAt?.toDate?.() ?? new Date(0);
          if (expiresAt <= now) return;
          list.push({
            id: d.id,
            userId: data.userId,
            imageUrl: data.imageUrl,
            caption: data.caption ?? "",
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            expiresAt,
          });
        });
        setAllStories(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);

  const storiesByUser = useMemo(() => {
    const m = new Map<string, Story[]>();
    allStories.forEach((s) => {
      const arr = m.get(s.userId) ?? [];
      arr.push(s);
      m.set(s.userId, arr);
    });
    // Sort each user's stories oldest first
    m.forEach((arr) => arr.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
    return m;
  }, [allStories]);

  const storyUserIds = useMemo(
    () => new Set(allStories.map((s) => s.userId)),
    [allStories]
  );

  const myStories = useMemo(
    () => storiesByUser.get(user?.uid ?? "") ?? [],
    [storiesByUser, user?.uid]
  );

  const createStory = useCallback(
    async (imageUri: string, caption?: string) => {
      if (!user) throw new Error("Not authenticated");
      const filename = `stories/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await addDoc(collection(db, "stories"), {
        userId: user.uid,
        imageUrl,
        caption: caption ?? "",
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });
    },
    [user]
  );

  const hasStory = useCallback(
    (userId: string) => storyUserIds.has(userId),
    [storyUserIds]
  );

  const getStoriesForUser = useCallback(
    (userId: string) => storiesByUser.get(userId) ?? [],
    [storiesByUser]
  );

  /** Like a story. Saves like + sends emoji to chat. */
  const likeStory = useCallback(
    async (storyId: string, emoji?: string) => {
      if (!user) return;
      await setDoc(doc(db, "users", user.uid, "story_likes", storyId), {
        at: serverTimestamp(),
      });
      // Find story owner and send emoji to chat
      const story = allStories.find((s) => s.id === storyId);
      if (story && story.userId !== user.uid) {
        const chatId = [user.uid, story.userId].sort().join("_");
        const chatRef = doc(db, "chats", chatId);
        const emojiText = emoji || "❤️";
        await setDoc(chatRef, {
          participants: [user.uid, story.userId].sort(),
          lastMessage: `Hikayeni beğendi ${emojiText}`,
          lastMessageAt: serverTimestamp(),
          lastSenderId: user.uid,
        }, { merge: true });
        await addDoc(collection(db, "chats", chatId, "messages"), {
          senderId: user.uid,
          text: `Hikayeni beğendi ${emojiText}`,
          type: "text",
          createdAt: serverTimestamp(),
          status: "sent",
        });
      }
    },
    [user, allStories]
  );

  const unlikeStory = useCallback(
    async (storyId: string) => {
      if (!user) return;
      await deleteDoc(doc(db, "users", user.uid, "story_likes", storyId));
    },
    [user]
  );

  /** Reply to story → saves reply + sends message to chat. */
  const replyToStory = useCallback(
    async (storyId: string, text: string) => {
      if (!user) return;
      await addDoc(collection(db, "stories", storyId, "replies"), {
        userId: user.uid,
        text,
        at: serverTimestamp(),
      });
      // Also send to chat
      const story = allStories.find((s) => s.id === storyId);
      if (story && story.userId !== user.uid) {
        const chatId = [user.uid, story.userId].sort().join("_");
        const chatRef = doc(db, "chats", chatId);
        await setDoc(chatRef, {
          participants: [user.uid, story.userId].sort(),
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          lastSenderId: user.uid,
        }, { merge: true });
        await addDoc(collection(db, "chats", chatId, "messages"), {
          senderId: user.uid,
          text,
          type: "text",
          createdAt: serverTimestamp(),
          status: "sent",
        });
      }
    },
    [user, allStories]
  );

  return {
    stories: allStories,
    storyUserIds,
    storiesByUser,
    myStories,
    loading,
    createStory,
    hasStory,
    getStoriesForUser,
    likeStory,
    unlikeStory,
    replyToStory,
  };
}
