import { useEffect, useCallback } from "react";
import {
  initConnection,
  endConnection,
  getProducts,
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  ProductPurchase,
  SubscriptionPurchase,
} from "react-native-iap";

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

type Options = {
  onCoinsPurchased: (productId: string) => void;
  onPremiumPurchased: (productId: string) => void;
  onError: (msg: string) => void;
};

export function useIAP({ onCoinsPurchased, onPremiumPurchased, onError }: Options) {
  useEffect(() => {
    let purchaseListener: ReturnType<typeof purchaseUpdatedListener>;
    let errorListener: ReturnType<typeof purchaseErrorListener>;

    initConnection()
      .then(() => {
        purchaseListener = purchaseUpdatedListener(async (purchase: ProductPurchase | SubscriptionPurchase) => {
          if (purchase.transactionReceipt) {
            await finishTransaction({ purchase, isConsumable: COIN_SKUS.includes(purchase.productId) });
            if (COIN_SKUS.includes(purchase.productId)) {
              onCoinsPurchased(purchase.productId);
            } else if (PREMIUM_SKUS.includes(purchase.productId)) {
              onPremiumPurchased(purchase.productId);
            }
          }
        });

        errorListener = purchaseErrorListener((err) => {
          if ((err as any).code !== "E_USER_CANCELLED") {
            onError(err.message || "Satın alma başarısız.");
          }
        });
      })
      .catch(() => {});

    return () => {
      purchaseListener?.remove();
      errorListener?.remove();
      endConnection();
    };
  }, []);

  const buyCoins = useCallback(async (productId: string) => {
    try {
      await getProducts({ skus: COIN_SKUS });
      await requestPurchase({ skus: [productId], andDangerouslyFinishTransactionAutomaticallyIOS: false });
    } catch (err: any) {
      if (err?.code !== "E_USER_CANCELLED") onError(err?.message || "Satın alma başarısız.");
    }
  }, []);

  const buyPremium = useCallback(async (productId: string) => {
    try {
      await getSubscriptions({ skus: PREMIUM_SKUS });
      await requestSubscription({ sku: productId, andDangerouslyFinishTransactionAutomaticallyIOS: false });
    } catch (err: any) {
      if (err?.code !== "E_USER_CANCELLED") onError(err?.message || "Satın alma başarısız.");
    }
  }, []);

  return { buyCoins, buyPremium };
}
