import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/config/firebase";
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

/**
 * Real-time subscription to `posts` collection.
 * If userId supplied, filters to that user's posts only.
 * Hides archived posts from non-owners.
 */
export function usePosts(userId?: string) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  // Subscribe to posts
  useEffect(() => {
    const q = userId
      ? query(collection(db, "posts"), where("userId", "==", userId), orderBy("createdAt", "desc"))
      : query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Post[] = [];
        snap.forEach((d) => {
          const data = d.data();
          // Hide archived from others
          if (data.archived && data.userId !== user?.uid) return;
          list.push({
            id: d.id,
            userId: data.userId,
            text: data.text ?? "",
            imageUrl: data.imageUrl ?? undefined,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            archived: data.archived ?? false,
            likesCount: data.likesCount ?? 0,
          });
        });
        setPosts(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [userId, user?.uid]);

  // Subscribe to current user's liked posts
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "post_likes"),
      (snap) => {
        const ids = new Set<string>();
        snap.forEach((d) => ids.add(d.id));
        setLikedPostIds(ids);
      }
    );
    return unsub;
  }, [user?.uid]);

  const isPostLiked = useCallback(
    (postId: string) => likedPostIds.has(postId),
    [likedPostIds]
  );

  const togglePostLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      const liked = likedPostIds.has(postId);
      if (liked) {
        await deleteDoc(doc(db, "users", user.uid, "post_likes", postId));
        await updateDoc(doc(db, "posts", postId), { likesCount: increment(-1) });
      } else {
        await setDoc(doc(db, "users", user.uid, "post_likes", postId), { at: serverTimestamp() });
        await updateDoc(doc(db, "posts", postId), { likesCount: increment(1) });
      }
    },
    [user, likedPostIds]
  );

  const createPost = useCallback(
    async (text: string, imageUri?: string) => {
      if (!user) return;
      let imageUrl: string | undefined;
      if (imageUri) {
        const filename = `posts/${user.uid}/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        text,
        imageUrl: imageUrl ?? null,
        createdAt: serverTimestamp(),
        archived: false,
        likesCount: 0,
      });
    },
    [user]
  );

  const deletePost = useCallback(async (postId: string) => {
    await deleteDoc(doc(db, "posts", postId));
  }, []);

  const archivePost = useCallback(async (postId: string, archived: boolean) => {
    await updateDoc(doc(db, "posts", postId), { archived });
  }, []);

  const editPost = useCallback(async (postId: string, text: string) => {
    await updateDoc(doc(db, "posts", postId), { text });
  }, []);

  return {
    posts,
    loading,
    likedPostIds,
    isPostLiked,
    togglePostLike,
    createPost,
    deletePost,
    archivePost,
    editPost,
  };
}

/**
 * Real-time comments subscription for a specific post.
 */
export function usePostComments(postId: string | null) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "posts", postId, "comments"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: PostComment[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            userId: data.userId ?? "",
            userName: data.userName ?? "",
            userPhoto: data.userPhoto ?? "",
            text: data.text ?? "",
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          });
        });
        setComments(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [postId]);

  const addComment = useCallback(
    async (text: string) => {
      if (!user || !postId) return;
      await addDoc(collection(db, "posts", postId, "comments"), {
        userId: user.uid,
        userName: profile?.name ?? "Anonim",
        userPhoto: profile?.photoURL ?? "",
        text,
        createdAt: serverTimestamp(),
      });
    },
    [user, postId, profile]
  );

  return { comments, loading, addComment };
}
