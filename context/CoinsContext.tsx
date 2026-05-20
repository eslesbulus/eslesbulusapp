import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

export const INITIAL_TOKENS = 100;
export const TOKENS_PER_MESSAGE = 10;

type CoinsContextType = {
  balance: number;
  add: (n: number) => Promise<void>;
  spend: (n: number) => Promise<boolean>;
};

const CoinsContext = createContext<CoinsContextType>({
  balance: 0,
  add: async () => {},
  spend: async () => false,
});

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const { user, isDevAdmin } = useAuth();
  const [balance, setBalance] = useState(INITIAL_TOKENS);

  useEffect(() => {
    if (isDevAdmin || !user) return;

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (typeof data.tokens === "number") {
        setBalance(data.tokens);
      } else {
        // Initialize tokens for new users
        updateDoc(doc(db, "users", user.uid), { tokens: INITIAL_TOKENS }).catch(() => {});
        setBalance(INITIAL_TOKENS);
      }
    });

    return unsub;
  }, [user, isDevAdmin]);

  const add = useCallback(async (n: number) => {
    if (isDevAdmin) {
      setBalance((b) => b + n);
      return;
    }
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), { tokens: increment(n) });
  }, [user, isDevAdmin]);

  const spend = useCallback(async (n: number): Promise<boolean> => {
    if (isDevAdmin) {
      if (balance < n) return false;
      setBalance((b) => b - n);
      return true;
    }
    if (!user || balance < n) return false;
    await updateDoc(doc(db, "users", user.uid), { tokens: increment(-n) });
    return true;
  }, [user, isDevAdmin, balance]);

  return (
    <CoinsContext.Provider value={{ balance, add, spend }}>
      {children}
    </CoinsContext.Provider>
  );
}

export const useCoins = () => useContext(CoinsContext);
