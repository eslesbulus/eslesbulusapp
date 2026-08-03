import { useEffect, useCallback, useRef } from "react";
import { logPurchase } from "@/config/facebook";

export const COIN_SKUS = [
  "com.eslesbulus.coins100",
  "com.eslesbulus.coins500",
  "com.eslesbulus.coins1000",
];

export const PREMIUM_SKUS = [
  "com.eslesbulus.premium.day",
  "com.eslesbulus.premium.week",
  "com.eslesbulus.premium.month",
];

let iap: any = null;
let isUserCancelledError: ((err: any) => boolean) | null = null;
try {
  iap = require("react-native-iap");
  isUserCancelledError = require("react-native-iap/lib/module/utils/error").isUserCancelledError;
} catch {}

type Options = {
  onCoinsPurchased: (productId: string) => void;
  onPremiumPurchased: (productId: string) => void;
  onError: (msg: string) => void;
};

type PriceInfo = { price: number; currency: string };

function extractPrice(p: any): PriceInfo | null {
  if (typeof p?.price === "number" && p.price > 0 && typeof p?.currency === "string") {
    return { price: p.price, currency: p.currency };
  }
  return null;
}

function isCancelled(err: any): boolean {
  if (isUserCancelledError) {
    try { return isUserCancelledError(err); } catch {}
  }
  const code = err?.code ?? "";
  return (
    code === "E_USER_CANCELLED" ||
    code === "E_USER_CANCELED" ||
    code === "user-cancelled" ||
    err?.responseCode === 1
  );
}

export function useIAP({ onCoinsPurchased, onPremiumPurchased, onError }: Options) {
  const pricesRef = useRef<Record<string, PriceInfo>>({});
  const loggedRef = useRef<Set<string>>(new Set());

  const cachePrices = useCallback((list: any[]) => {
    for (const p of list ?? []) {
      const id = p?.productId ?? p?.id;
      if (!id) continue;
      const info = extractPrice(p);
      if (info) pricesRef.current[id] = info;
    }
  }, []);

  useEffect(() => {
    if (!iap) return;

    let purchaseListener: any;
    let errorListener: any;

    iap.initConnection()
      .then(async () => {
        try {
          const products = await iap.fetchProducts({ skus: [...COIN_SKUS, ...PREMIUM_SKUS], type: "in-app" });
          cachePrices(products);
        } catch {}

        purchaseListener = iap.purchaseUpdatedListener(async (purchase: any) => {
          try {
            const productId = purchase?.productId;
            if (!productId) return;

            await iap.finishTransaction({ purchase, isConsumable: true });

            const txId = purchase.id ?? purchase.transactionId ?? `${productId}_${purchase.transactionDate}`;
            const info = pricesRef.current[productId];
            if (info && !loggedRef.current.has(txId)) {
              loggedRef.current.add(txId);
              logPurchase(info.price, info.currency, {
                fb_content_id: productId,
                fb_content_type: COIN_SKUS.includes(productId) ? "coins" : "premium",
              });
            }

            if (COIN_SKUS.includes(productId)) {
              onCoinsPurchased(productId);
            } else if (PREMIUM_SKUS.includes(productId)) {
              onPremiumPurchased(productId);
            }
          } catch (e: any) {
            onError(e?.message || "İşlem tamamlanamadı.");
          }
        });

        errorListener = iap.purchaseErrorListener((err: any) => {
          if (!isCancelled(err)) {
            onError(err?.message || "Satın alma başarısız.");
          }
        });
      })
      .catch(() => {});

    return () => {
      purchaseListener?.remove();
      errorListener?.remove();
      iap.endConnection();
    };
  }, []);

  const buyCoins = useCallback(async (productId: string) => {
    if (!iap) return onError("Satın alma bu ortamda desteklenmiyor.");
    try {
      const products = await iap.fetchProducts({ skus: COIN_SKUS, type: "in-app" });
      cachePrices(products);
      await iap.requestPurchase({
        request: { google: { skus: [productId] } },
        type: "in-app",
      });
    } catch (err: any) {
      if (!isCancelled(err)) onError(err?.message || "Satın alma başarısız.");
    }
  }, []);

  const buyPremium = useCallback(async (productId: string) => {
    if (!iap) return onError("Satın alma bu ortamda desteklenmiyor.");
    try {
      const products = await iap.fetchProducts({ skus: PREMIUM_SKUS, type: "in-app" });
      cachePrices(products);
      await iap.requestPurchase({
        request: { google: { skus: [productId] } },
        type: "in-app",
      });
    } catch (err: any) {
      if (!isCancelled(err)) onError(err?.message || "Satın alma başarısız.");
    }
  }, []);

  return { buyCoins, buyPremium };
}
