import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";

export const DAILY_LIKE_LIMIT = 10;
export const DAILY_HI_LIMIT = 10;

export type PremiumPlan = "day" | "week" | "month";

type PremiumContextType = {
  isPremium: boolean;
  premiumExpiry: Date | null;
  dailyLikesUsed: number;
  dailyHisUsed: number;
  likesRemaining: number;
  hisRemaining: number;
  canLike: boolean;
  canSendHi: boolean;
  useLike: () => Promise<boolean>;
  useHi: () => Promise<boolean>;
  activatePremium: (plan: PremiumPlan) => Promise<void>;
  loading: boolean;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  premiumExpiry: null,
  dailyLikesUsed: 0,
  dailyHisUsed: 0,
  likesRemaining: DAILY_LIKE_LIMIT,
  hisRemaining: DAILY_HI_LIMIT,
  canLike: true,
  canSendHi: true,
  useLike: async () => true,
  useHi: async () => true,
  activatePremium: async () => {},
  loading: true,
});

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getPremiumExpiry(plan: PremiumPlan): Date {
  const d = new Date();
  if (plan === "day") d.setDate(d.getDate() + 1);
  else if (plan === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const { user, isDevAdmin } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<Date | null>(null);
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0);
  const [dailyHisUsed, setDailyHisUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDevAdmin) {
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (!snap.exists()) {
        setLoading(false);
        return;
      }
      const data = snap.data();

      // Check premium validity
      const expiry = data.premiumExpiry?.toDate?.() ?? null;
      const active = data.isPremium === true && expiry !== null && expiry > new Date();
      setIsPremium(active);
      setPremiumExpiry(expiry);

      // Daily reset logic
      const today = getToday();
      const lastReset = data.lastResetDate ?? "";
      if (lastReset !== today) {
        updateDoc(doc(db, "users", user.uid), {
          dailyLikesUsed: 0,
          dailyHisUsed: 0,
          lastResetDate: today,
        }).catch(() => {});
        setDailyLikesUsed(0);
        setDailyHisUsed(0);
      } else {
        setDailyLikesUsed(data.dailyLikesUsed ?? 0);
        setDailyHisUsed(data.dailyHisUsed ?? 0);
      }

      setLoading(false);
    });

    return unsub;
  }, [user, isDevAdmin]);

  const canLike = isDevAdmin || isPremium || dailyLikesUsed < DAILY_LIKE_LIMIT;
  const canSendHi = isDevAdmin || isPremium || dailyHisUsed < DAILY_HI_LIMIT;
  const likesRemaining = isPremium ? 9999 : Math.max(0, DAILY_LIKE_LIMIT - dailyLikesUsed);
  const hisRemaining = isPremium ? 9999 : Math.max(0, DAILY_HI_LIMIT - dailyHisUsed);

  const useLike = useCallback(async (): Promise<boolean> => {
    if (isDevAdmin || isPremium) return true;
    if (!user) return false;
    if (dailyLikesUsed >= DAILY_LIKE_LIMIT) return false;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        dailyLikesUsed: increment(1),
      });
    } catch {}
    setDailyLikesUsed((p) => p + 1);
    return true;
  }, [user, isDevAdmin, isPremium, dailyLikesUsed]);

  const useHi = useCallback(async (): Promise<boolean> => {
    if (isDevAdmin || isPremium) return true;
    if (!user) return false;
    if (dailyHisUsed >= DAILY_HI_LIMIT) return false;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        dailyHisUsed: increment(1),
      });
    } catch {}
    setDailyHisUsed((p) => p + 1);
    return true;
  }, [user, isDevAdmin, isPremium, dailyHisUsed]);

  const activatePremium = useCallback(async (plan: PremiumPlan) => {
    const expiry = getPremiumExpiry(plan);
    if (isDevAdmin) {
      setIsPremium(true);
      setPremiumExpiry(expiry);
      return;
    }
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      isPremium: true,
      premiumExpiry: expiry,
    });
  }, [user, isDevAdmin]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        premiumExpiry,
        dailyLikesUsed,
        dailyHisUsed,
        likesRemaining,
        hisRemaining,
        canLike,
        canSendHi,
        useLike,
        useHi,
        activatePremium,
        loading,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => useContext(PremiumContext);
