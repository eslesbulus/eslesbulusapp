import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/config/api";
import { getSocket } from "@/config/socket";
import { useAuth } from "@/context/AuthContext";

export type Story = {
  id: string;
  userId: string;
  imageUrl: string;
  caption: string;
  createdAt: Date;
  expiresAt: Date;
};

export function useStories() {
  const { user } = useAuth();
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const raw = await api.get<any[]>("/api/stories");
      const list: Story[] = raw.map((s) => ({
        id: s._id || s.id,
        userId: s.userId,
        imageUrl: s.imageUrl,
        caption: s.caption ?? "",
        createdAt: new Date(s.createdAt),
        expiresAt: new Date(s.expiresAt),
      }));
      setAllStories(list);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const storiesByUser = useMemo(() => {
    const m = new Map<string, Story[]>();
    allStories.forEach((s) => {
      const arr = m.get(s.userId) ?? [];
      arr.push(s);
      m.set(s.userId, arr);
    });
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
      const uploaded = await api.upload("stories", imageUri);
      await api.post("/api/stories", {
        imageUrl: uploaded.url,
        caption: caption ?? "",
      });
      await fetchStories(); // refresh
    },
    [user, fetchStories]
  );

  const hasStory = useCallback(
    (userId: string) => storyUserIds.has(userId),
    [storyUserIds]
  );

  const getStoriesForUser = useCallback(
    (userId: string) => storiesByUser.get(userId) ?? [],
    [storiesByUser]
  );

  const likeStory = useCallback(
    async (storyId: string, emoji?: string) => {
      if (!user) return;
      await api.post(`/api/stories/${storyId}/like`);
      // Also send to chat
      const story = allStories.find((s) => s.id === storyId);
      if (story && story.userId !== user.uid) {
        const socket = getSocket();
        if (socket) {
          socket.emit("chat:send", {
            to: story.userId,
            text: `Hikayeni beğendi ${emoji || "❤️"}`,
            type: "text",
          });
        }
      }
    },
    [user, allStories]
  );

  const unlikeStory = useCallback(
    async (storyId: string) => {
      if (!user) return;
      // Could add an unlike endpoint if needed
    },
    [user]
  );

  const replyToStory = useCallback(
    async (storyId: string, text: string) => {
      if (!user) return;
      await api.post(`/api/stories/${storyId}/reply`, { text });
      // Also send to chat
      const story = allStories.find((s) => s.id === storyId);
      if (story && story.userId !== user.uid) {
        const socket = getSocket();
        if (socket) {
          socket.emit("chat:send", {
            to: story.userId,
            text,
            type: "text",
          });
        }
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
