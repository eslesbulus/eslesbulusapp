import { useEffect, useCallback } from "react";

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

// react-native-iap v16 uses Nitro native modules — not available in Expo Go.
// We lazy-require so the app doesn't crash; IAP simply won't work in Expo Go.
let iap: any = null;
try {
  iap = require("react-native-iap");
} catch {
  // Expo Go — native modules unavailable
}

type Options = {
  onCoinsPurchased: (productId: string) => void;
  onPremiumPurchased: (productId: string) => void;
  onError: (msg: string) => void;
};

export function useIAP({ onCoinsPurchased, onPremiumPurchased, onError }: Options) {
  useEffect(() => {
    if (!iap) return;

    let purchaseListener: any;
    let errorListener: any;

    iap.initConnection()
      .then(() => {
        purchaseListener = iap.purchaseUpdatedListener(async (purchase: any) => {
          if (purchase.transactionReceipt) {
            await iap.finishTransaction({ purchase, isConsumable: COIN_SKUS.includes(purchase.productId) });
            if (COIN_SKUS.includes(purchase.productId)) {
              onCoinsPurchased(purchase.productId);
            } else if (PREMIUM_SKUS.includes(purchase.productId)) {
              onPremiumPurchased(purchase.productId);
            }
          }
        });

        errorListener = iap.purchaseErrorListener((err: any) => {
          if (err?.code !== "E_USER_CANCELLED") {
            onError(err.message || "Satın alma başarısız.");
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
      await iap.getProducts({ skus: COIN_SKUS });
      await iap.requestPurchase({ skus: [productId], andDangerouslyFinishTransactionAutomaticallyIOS: false });
    } catch (err: any) {
      if (err?.code !== "E_USER_CANCELLED") onError(err?.message || "Satın alma başarısız.");
    }
  }, []);

  const buyPremium = useCallback(async (productId: string) => {
    if (!iap) return onError("Satın alma bu ortamda desteklenmiyor.");
    try {
      await iap.getSubscriptions({ skus: PREMIUM_SKUS });
      await iap.requestSubscription({ sku: productId, andDangerouslyFinishTransactionAutomaticallyIOS: false });
    } catch (err: any) {
      if (err?.code !== "E_USER_CANCELLED") onError(err?.message || "Satın alma başarısız.");
    }
  }, []);

  return { buyCoins, buyPremium };
}
