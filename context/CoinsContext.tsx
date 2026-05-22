import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/config/api";
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
  const { user, profile, isDevAdmin, refreshProfile } = useAuth();
  const [balance, setBalance] = useState(INITIAL_TOKENS);

  // Sync balance from profile
  useEffect(() => {
    if (isDevAdmin) return;
    if (profile && typeof profile.tokens === "number") {
      setBalance(profile.tokens);
    }
  }, [profile, isDevAdmin]);

  const add = useCallback(async (n: number) => {
    if (isDevAdmin) {
      setBalance((b) => b + n);
      return;
    }
    if (!user) return;
    setBalance((b) => b + n); // optimistic
    await api.put("/api/users/me", { tokens: balance + n });
    await refreshProfile();
  }, [user, isDevAdmin, balance, refreshProfile]);

  const spend = useCallback(async (n: number): Promise<boolean> => {
    if (isDevAdmin) {
      if (balance < n) return false;
      setBalance((b) => b - n);
      return true;
    }
    if (!user || balance < n) return false;
    setBalance((b) => b - n); // optimistic
    await api.put("/api/users/me", { tokens: balance - n });
    return true;
  }, [user, isDevAdmin, balance]);

  return (
    <CoinsContext.Provider value={{ balance, add, spend }}>
      {children}
    </CoinsContext.Provider>
  );
}

export const useCoins = () => useContext(CoinsContext);
