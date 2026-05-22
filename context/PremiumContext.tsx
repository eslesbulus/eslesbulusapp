import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

export const DAILY_LIKE_LIMIT = 10;
export const DAILY_HI_LIMIT = 10;
export const DAILY_STORY_LIKE_LIMIT = 5;

export type PremiumPlan = "day" | "week" | "month";

type PremiumContextType = {
  isPremium: boolean;
  premiumExpiry: Date | null;
  dailyLikesUsed: number;
  dailyHisUsed: number;
  dailyStoryLikesUsed: number;
  likesRemaining: number;
  hisRemaining: number;
  storyLikesRemaining: number;
  canLike: boolean;
  canSendHi: boolean;
  canLikeStory: boolean;
  useLike: () => Promise<boolean>;
  useHi: () => Promise<boolean>;
  useStoryLike: () => Promise<boolean>;
  activatePremium: (plan: PremiumPlan) => Promise<void>;
  loading: boolean;
};

const PremiumContext = createContext<PremiumContextType>({
  isPremium: false,
  premiumExpiry: null,
  dailyLikesUsed: 0,
  dailyHisUsed: 0,
  dailyStoryLikesUsed: 0,
  likesRemaining: DAILY_LIKE_LIMIT,
  hisRemaining: DAILY_HI_LIMIT,
  storyLikesRemaining: DAILY_STORY_LIKE_LIMIT,
  canLike: true,
  canSendHi: true,
  canLikeStory: true,
  useLike: async () => true,
  useHi: async () => true,
  useStoryLike: async () => true,
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
  const { user, profile, isDevAdmin, refreshProfile } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState<Date | null>(null);
  const [dailyLikesUsed, setDailyLikesUsed] = useState(0);
  const [dailyHisUsed, setDailyHisUsed] = useState(0);
  const [dailyStoryLikesUsed, setDailyStoryLikesUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Sync from profile
  useEffect(() => {
    if (isDevAdmin) { setLoading(false); return; }
    if (!profile) { setLoading(false); return; }

    const expiry = profile.premiumExpiry ? new Date(profile.premiumExpiry) : null;
    const active = profile.isPremium === true && expiry !== null && expiry > new Date();
    setIsPremium(active);
    setPremiumExpiry(expiry);

    // Sync vip if expired
    if (!active && profile.vip === true) {
      api.put("/api/users/me", { vip: false }).catch(() => {});
    }

    // Daily reset
    const today = getToday();
    const lastReset = profile.dailyResetDate ?? "";
    if (lastReset !== today) {
      api.put("/api/users/me", {
        dailyLikesUsed: 0,
        dailyHisUsed: 0,
        dailyStoryLikesUsed: 0,
        dailyResetDate: today,
      }).catch(() => {});
      setDailyLikesUsed(0);
      setDailyHisUsed(0);
      setDailyStoryLikesUsed(0);
    } else {
      setDailyLikesUsed(profile.dailyLikesUsed ?? 0);
      setDailyHisUsed(profile.dailyHisUsed ?? 0);
      setDailyStoryLikesUsed(profile.dailyStoryLikesUsed ?? 0);
    }

    setLoading(false);
  }, [profile, isDevAdmin]);

  const canLike = isDevAdmin || isPremium || dailyLikesUsed < DAILY_LIKE_LIMIT;
  const canSendHi = isDevAdmin || isPremium || dailyHisUsed < DAILY_HI_LIMIT;
  const canLikeStory = isDevAdmin || isPremium || dailyStoryLikesUsed < DAILY_STORY_LIKE_LIMIT;
  const likesRemaining = isPremium ? 9999 : Math.max(0, DAILY_LIKE_LIMIT - dailyLikesUsed);
  const hisRemaining = isPremium ? 9999 : Math.max(0, DAILY_HI_LIMIT - dailyHisUsed);
  const storyLikesRemaining = isPremium ? 9999 : Math.max(0, DAILY_STORY_LIKE_LIMIT - dailyStoryLikesUsed);

  const useLike = useCallback(async (): Promise<boolean> => {
    if (isDevAdmin || isPremium) return true;
    if (!user) return false;
    if (dailyLikesUsed >= DAILY_LIKE_LIMIT) return false;
    setDailyLikesUsed((p) => p + 1);
    api.put("/api/users/me", { dailyLikesUsed: dailyLikesUsed + 1 }).catch(() => {});
    return true;
  }, [user, isDevAdmin, isPremium, dailyLikesUsed]);

  const useHi = useCallback(async (): Promise<boolean> => {
    if (isDevAdmin || isPremium) return true;
    if (!user) return false;
    if (dailyHisUsed >= DAILY_HI_LIMIT) return false;
    setDailyHisUsed((p) => p + 1);
    api.put("/api/users/me", { dailyHisUsed: dailyHisUsed + 1 }).catch(() => {});
    return true;
  }, [user, isDevAdmin, isPremium, dailyHisUsed]);

  const useStoryLike = useCallback(async (): Promise<boolean> => {
    if (isDevAdmin || isPremium) return true;
    if (!user) return false;
    if (dailyStoryLikesUsed >= DAILY_STORY_LIKE_LIMIT) return false;
    setDailyStoryLikesUsed((p) => p + 1);
    api.put("/api/users/me", { dailyStoryLikesUsed: dailyStoryLikesUsed + 1 }).catch(() => {});
    return true;
  }, [user, isDevAdmin, isPremium, dailyStoryLikesUsed]);

  const activatePremium = useCallback(async (plan: PremiumPlan) => {
    const expiry = getPremiumExpiry(plan);
    if (isDevAdmin) {
      setIsPremium(true);
      setPremiumExpiry(expiry);
      return;
    }
    if (!user) return;
    await api.put("/api/users/me", {
      isPremium: true,
      premiumExpiry: expiry.toISOString(),
      vip: true,
    });
    setIsPremium(true);
    setPremiumExpiry(expiry);
    await refreshProfile();
  }, [user, isDevAdmin, refreshProfile]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium, premiumExpiry,
        dailyLikesUsed, dailyHisUsed, dailyStoryLikesUsed,
        likesRemaining, hisRemaining, storyLikesRemaining,
        canLike, canSendHi, canLikeStory,
        useLike, useHi, useStoryLike,
        activatePremium, loading,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export const usePremium = () => useContext(PremiumContext);
