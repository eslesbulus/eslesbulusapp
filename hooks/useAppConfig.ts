import { useEffect, useState } from "react";
import { BASE_URL } from "@/config/api";

export type CoinPackage = {
  id: string;
  tokens: number;
  price: string;
  productId?: string;
  bonus?: string;
  popular?: boolean;
  messages?: number;
};

export type PremiumPlanConfig = {
  id: string;
  label: string;
  price: string;
  productId?: string;
  duration?: string;
  perDay?: string;
  popular?: boolean;
};

export type AppConfig = {
  callsEnabled: boolean;
  giftEnabled: boolean;
  storyEnabled: boolean;
  announcementText: string;
  coinPackages: CoinPackage[];
  premiumPlans: PremiumPlanConfig[];
  messageTokenCost: number;
};

const DEFAULTS: AppConfig = {
  callsEnabled: true,
  giftEnabled: true,
  storyEnabled: true,
  announcementText: "",
  coinPackages: [],
  premiumPlans: [],
  messageTokenCost: 0,
};

// Modül seviyesinde önbellek — /api/config public (auth gerektirmez)
let _cache: AppConfig | null = null;
let _fetchedAt = 0;
const TTL = 60000; // 1 dk

/**
 * Uygulama ayarlarını backend'den okur (arama aç/kapa, jeton paketleri,
 * premium planları, fiyatlar). Admin panelden anlık yönetilir.
 */
export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(_cache ?? DEFAULTS);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    if (_cache && now - _fetchedAt < TTL) {
      setConfig(_cache);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch(`${BASE_URL}/api/config`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        clearTimeout(timeout);
        if (cancelled || !d) return;
        const cfg: AppConfig = {
          ...DEFAULTS,
          ...d,
          callsEnabled: d.callsEnabled !== false,
          coinPackages: Array.isArray(d.coinPackages) ? d.coinPackages : [],
          premiumPlans: Array.isArray(d.premiumPlans) ? d.premiumPlans : [],
        };
        _cache = cfg;
        _fetchedAt = Date.now();
        setConfig(cfg);
      })
      .catch(() => {
        clearTimeout(timeout);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  return config;
}
