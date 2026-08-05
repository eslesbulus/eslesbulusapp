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
try {
  iap = require("react-native-iap");
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

// v16 hata kodlari kebab-case: "user-cancelled", "already-owned",
// "duplicate-purchase". Eski surumler de destekleniyor.
function isCancelled(err: any): boolean {
  const code = String(err?.code ?? "").toLowerCase();
  return (
    code === "user-cancelled" ||
    code === "user-canceled" ||
    code === "e_user_cancelled" ||
    code === "e_user_canceled" ||
    err?.responseCode === 1
  );
}

function isAlreadyOwned(err: any): boolean {
  const code = String(err?.code ?? "").toLowerCase();
  return (
    code === "already-owned" ||
    code === "e_already_owned" ||
    code === "duplicate-purchase" ||
    err?.responseCode === 7
  );
}

// Tuketilmemis satin alimlari temizle. Google Play consumable urunleri
// "sahiplenilmis" olarak tutar, finishTransaction ile consume edilene kadar
// ayni urun tekrar satin alinamaz ("Bu oge zaten sizde var" hatasi).
async function consumePendingPurchases(): Promise<void> {
  if (!iap) return;
  try {
    const owned = await iap.getAvailablePurchases();
    for (const p of owned ?? []) {
      try {
        await iap.finishTransaction({ purchase: p, isConsumable: true });
      } catch {}
    }
  } catch {}
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
        // --------------------------------------------------------
        // 1) Onceki tuketilmemis satin alimlari temizle.
        //    Uygulama crash olursa veya finishTransaction basarisiz
        //    olursa eski purchaseToken'lar Google Play'de kalir ve
        //    "Bu oge zaten sizde var" hatasina neden olur.
        // --------------------------------------------------------
        await consumePendingPurchases();

        // --------------------------------------------------------
        // 2) Urunleri yukle ve fiyatlari onbellekle.
        // --------------------------------------------------------
        try {
          const products = await iap.fetchProducts({ skus: [...COIN_SKUS, ...PREMIUM_SKUS], type: "in-app" });
          cachePrices(products);
        } catch {}

        // --------------------------------------------------------
        // 3) Satin alma tamamlandiginda — jeton/premium ver.
        // --------------------------------------------------------
        purchaseListener = iap.purchaseUpdatedListener(async (purchase: any) => {
          try {
            const productId = purchase?.productId;
            if (!productId) return;

            // Odeme KESINLESMEDEN jeton/premium verilmemeli. Android'de yavas
            // odeme yontemleri (bakkal/kiosk) once "pending" durumda event
            // firlatir; o asamada para tahsil edilmemistir. Yalnizca
            // "purchased" (veya "restored") olanlari isliyoruz.
            const state = purchase.purchaseState;
            if (state && state !== "purchased") return;

            // Islemi tamamla + consume et (consumable urunler icin sart).
            // isConsumable: true olmadan Google Play urunu "sahiplenilmis"
            // olarak tutar ve tekrar satin almaya izin vermez.
            await iap.finishTransaction({ purchase, isConsumable: true });

            // Facebook purchase event logla (tekrar loglamayi onle).
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

        // --------------------------------------------------------
        // 4) Hata dinleyicisi — iptal, already-owned, diger hatalar.
        // --------------------------------------------------------
        errorListener = iap.purchaseErrorListener(async (err: any) => {
          // Kullanici iptal ettiyse sessizce gec.
          if (isCancelled(err)) return;

          // "Bu oge zaten sizde var" — onceki satin alim consume
          // edilememis. Simdi consume edip kullaniciya tekrar denemesini soyle.
          if (isAlreadyOwned(err)) {
            await consumePendingPurchases();
            onError("Önceki satın alımınız işlendi. Lütfen tekrar deneyin.");
            return;
          }

          onError(err?.message || "Satın alma başarısız.");
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
      // Her satin alma oncesi urunleri tekrar cek — Google Play bazen
      // eski product referanslarini gecersiz kilabiliyor.
      const products = await iap.fetchProducts({ skus: COIN_SKUS, type: "in-app" });
      cachePrices(products);
      await iap.requestPurchase({
        request: { google: { skus: [productId] } },
        type: "in-app",
      });
    } catch (err: any) {
      if (isAlreadyOwned(err)) {
        // Eski consume edilmemis satin alimi temizle ve bildir.
        await consumePendingPurchases();
        onError("Önceki satın alımınız işlendi. Lütfen tekrar deneyin.");
      } else if (!isCancelled(err)) {
        onError(err?.message || "Satın alma başarısız.");
      }
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
      if (isAlreadyOwned(err)) {
        await consumePendingPurchases();
        onError("Önceki satın alımınız işlendi. Lütfen tekrar deneyin.");
      } else if (!isCancelled(err)) {
        onError(err?.message || "Satın alma başarısız.");
      }
    }
  }, []);

  return { buyCoins, buyPremium };
}
