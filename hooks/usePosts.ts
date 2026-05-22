import { useEffect, useState, useCallback } from "react";
import { api } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

export type Post = {
  id: string;
  userId: string;
  text: string;
  imageUrl?: string;
  createdAt: Date;
  archived: boolean;
  likesCount: number;
};

export type PostComment = {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  text: string;
  createdAt: Date;
};

export function usePosts(userId?: string) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  const fetchPosts = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const path = userId ? `/api/posts/user/${userId}` : "/api/posts";
      const raw = await api.get<any[]>(path);
      const list: Post[] = raw.map((d) => ({
        id: d._id || d.id,
        userId: d.userId,
        text: d.text ?? "",
        imageUrl: d.imageUrl ?? undefined,
        createdAt: new Date(d.createdAt),
        archived: d.archived ?? false,
        likesCount: d.likesCount ?? 0,
      }));
      setPosts(list);

      const liked = new Set<string>();
      raw.forEach((d) => {
        if ((d.likedBy ?? []).includes(user.uid)) {
          liked.add(d._id || d.id);
        }
      });
      setLikedPostIds(liked);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [user, userId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const isPostLiked = useCallback(
    (postId: string) => likedPostIds.has(postId),
    [likedPostIds]
  );

  const togglePostLike = useCallback(async (postId: string) => {
    if (!user) return;
    const liked = likedPostIds.has(postId);
    if (liked) {
      setLikedPostIds((prev) => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount - 1) } : p));
    } else {
      setLikedPostIds((prev) => new Set(prev).add(postId));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p));
    }
    await api.post(`/api/posts/${postId}/like`);
  }, [user, likedPostIds]);

  const createPost = useCallback(async (text: string, imageUri?: string) => {
    if (!user) return;
    let imageUrl: string | undefined;
    if (imageUri) {
      const uploaded = await api.upload("posts", imageUri);
      imageUrl = uploaded.url;
    }
    await api.post("/api/posts", { text, imageUrl: imageUrl ?? null });
    await fetchPosts();
  }, [user, fetchPosts]);

  const deletePost = useCallback(async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    await api.delete(`/api/posts/${postId}`);
  }, []);

  const archivePost = useCallback(async (postId: string, archived: boolean) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, archived } : p)));
    await api.put(`/api/posts/${postId}`, { archived });
  }, []);

  const editPost = useCallback(async (postId: string, text: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, text } : p)));
    await api.put(`/api/posts/${postId}`, { text });
  }, []);

  return { posts, loading, likedPostIds, isPostLiked, togglePostLike, createPost, deletePost, archivePost, editPost };
}

export function usePostComments(postId: string | null) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) { setComments([]); setLoading(false); return; }
    let cancelled = false;
    api.get<any>(`/api/posts/${postId}`)
      .then((post) => {
        if (cancelled) return;
        const list: PostComment[] = (post.comments ?? []).map((c: any) => ({
          id: c._id || String(Math.random()),
          userId: c.userId ?? "",
          userName: c.userName ?? "",
          userPhoto: c.userPhoto ?? "",
          text: c.text ?? "",
          createdAt: new Date(c.createdAt),
        }));
        setComments(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [postId]);

  const addComment = useCallback(async (text: string) => {
    if (!user || !postId) return;
    const result = await api.post<any>(`/api/posts/${postId}/comment`, { text });
    setComments((prev) => [...prev, {
      id: result._id || String(Date.now()),
      userId: user.uid,
      userName: profile?.name ?? "Anonim",
      userPhoto: profile?.photoURL ?? "",
      text,
      createdAt: new Date(),
    }]);
  }, [user, postId, profile]);

  return { comments, loading, addComment };
}
