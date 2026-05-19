import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { MockUser } from "@/constants/mockUsers";

type BlockedUser = {
  id: string;
  name: string;
  photo: string;
  blockedAt: number;
};

type Ctx = {
  blockedUsers: BlockedUser[];
  blockUser: (user: MockUser) => void;
  unblockUser: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
};

const BlockedUsersContext = createContext<Ctx | null>(null);

export function BlockedUsersProvider({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);

  const blockUser = useCallback((user: MockUser) => {
    setBlocked((prev) => {
      if (prev.some((b) => b.id === user.id)) return prev;
      return [
        ...prev,
        { id: user.id, name: user.name, photo: user.photo, blockedAt: Date.now() },
      ];
    });
  }, []);

  const unblockUser = useCallback((userId: string) => {
    setBlocked((prev) => prev.filter((b) => b.id !== userId));
  }, []);

  const isBlocked = useCallback(
    (userId: string) => blocked.some((b) => b.id === userId),
    [blocked]
  );

  const value = useMemo(
    () => ({ blockedUsers: blocked, blockUser, unblockUser, isBlocked }),
    [blocked, blockUser, unblockUser, isBlocked]
  );

  return <BlockedUsersContext.Provider value={value}>{children}</BlockedUsersContext.Provider>;
}

export function useBlockedUsers() {
  const ctx = useContext(BlockedUsersContext);
  if (!ctx) throw new Error("useBlockedUsers must be inside BlockedUsersProvider");
  return ctx;
}
