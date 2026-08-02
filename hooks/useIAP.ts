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

type PriceInfo = { price: number; currency: string };

/**
 * Facebook'a gonderilecek tutari Google Play'in dondugu GERCEK veriden cikarir.
 * Ekrandaki "₺59,99" gibi sabit stringler kullanilamaz: kullanicinin ulkesine
 * gore para birimi ve tutar degisir, yanlis deger ROAS raporlarini bozar.
 */
function extractPrice(p: any): PriceInfo | null {
  // Tek seferlik urun (jeton) — fiyat dogrudan urun uzerinde
  if (typeof p?.price === "number" && p.price > 0 && typeof p?.currency === "string") {
    return { price: p.price, currency: p.currency };
  }

  // Abonelik — gercek tutar tekrar eden fazda. Ilk fazlar deneme/indirim
  // olabilecegi icin sondan basa tarayip ilk sifir olmayan fiyati al.
  for (const offer of p?.subscriptionOffers ?? []) {
    const phases = offer?.pricingPhasesAndroid?.pricingPhaseList ?? [];
    for (let i = phases.length - 1; i >= 0; i--) {
      const micros = Number(phases[i]?.priceAmountMicros);
      const cur = phases[i]?.priceCurrencyCode;
      if (Number.isFinite(micros) && micros > 0 && cur) {
        return { price: micros / 1_000_000, currency: cur };
      }
    }
    if (typeof offer?.price === "number" && offer.price > 0 && offer.currency) {
      return { price: offer.price, currency: offer.currency };
    }
  }
  return null;
}

export function useIAP({ onCoinsPurchased, onPremiumPurchased, onError }: Options) {
  // productId -> gercek fiyat/para birimi. Satin alma tamamlandiginda
  // Facebook'a dogru tutari gonderebilmek icin doldurulur.
  const pricesRef = useRef<Record<string, PriceInfo>>({});
  // Ayni satin alimi Facebook'a iki kez gondermeyi onler
  const loggedRef = useRef<Set<string>>(new Set());

  const cachePrices = useCallback((list: any[]) => {
    for (const p of list ?? []) {
      const id = p?.id ?? p?.productId;
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
        // Fiyatlari onden cek: uygulama acilisinda onceki oturumdan bekleyen
        // bir satin alim teslim edilirse de tutari bilelim.
        try {
          const [products, subs] = await Promise.all([
            iap.getProducts({ skus: COIN_SKUS }),
            iap.getSubscriptions({ skus: PREMIUM_SKUS }),
          ]);
          cachePrices(products);
          cachePrices(subs);
        } catch {}

        purchaseListener = iap.purchaseUpdatedListener(async (purchase: any) => {
          if (purchase.transactionReceipt) {
            await iap.finishTransaction({ purchase, isConsumable: COIN_SKUS.includes(purchase.productId) });

            // Facebook App Events — reklam kampanyalarinin satin alim icin
            // optimize edilebilmesi buna bagli. finishTransaction basarili
            // olduktan sonra, yani odeme kesinlestikten sonra gonderiliyor.
            const txId = purchase.id ?? purchase.transactionId ?? `${purchase.productId}_${purchase.transactionDate}`;
            const info = pricesRef.current[purchase.productId];
            if (info && !loggedRef.current.has(txId)) {
              loggedRef.current.add(txId);
              logPurchase(info.price, info.currency, {
                fb_content_id: purchase.productId,
                fb_content_type: COIN_SKUS.includes(purchase.productId) ? "coins" : "premium",
              });
            }

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
      cachePrices(await iap.getProducts({ skus: COIN_SKUS }));
      await iap.requestPurchase({ skus: [productId], andDangerouslyFinishTransactionAutomaticallyIOS: false });
    } catch (err: any) {
      if (err?.code !== "E_USER_CANCELLED") onError(err?.message || "Satın alma başarısız.");
    }
  }, []);

  const buyPremium = useCallback(async (productId: string) => {
    if (!iap) return onError("Satın alma bu ortamda desteklenmiyor.");
    try {
      cachePrices(await iap.getSubscriptions({ skus: PREMIUM_SKUS }));
      await iap.requestSubscription({ sku: productId, andDangerouslyFinishTransactionAutomaticallyIOS: false });
    } catch (err: any) {
      if (err?.code !== "E_USER_CANCELLED") onError(err?.message || "Satın alma başarısız.");
    }
  }, []);

  return { buyCoins, buyPremium };
}
