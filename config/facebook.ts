import { Platform } from "react-native";

// react-native-fbsdk-next native modul gerektirir — Expo Go'da yok.
// useIAP.ts ile ayni lazy-require deseni: yoksa sessizce no-op calisir.
let fb: any = null;
try {
  fb = require("react-native-fbsdk-next");
} catch {
  // Expo Go — native modul yok
}

const Settings = fb?.Settings ?? null;
const AppEventsLogger = fb?.AppEventsLogger ?? null;

let initialized = false;

/**
 * SDK'yi baslatir. app.config.js'teki plugin appID/clientToken'i zaten native
 * tarafa gomuyor, burada sadece init tetikleniyor.
 *
 * iOS'ta reklam olcumu icin setAdvertiserTrackingEnabled gerekiyor. Bunu true
 * yapmadan once ATT izni istenmeli — su an iOS'a cikilmadigi icin sadece
 * Android akisi aktif, iOS'a gecerken expo-tracking-transparency eklenmeli.
 */
export function initFacebookSdk() {
  if (initialized || !Settings) return;
  try {
    Settings.initializeSDK();
    if (Platform.OS === "ios") {
      Settings.setAdvertiserTrackingEnabled(true);
    }
    initialized = true;
  } catch {}
}

/**
 * Satin alimi Facebook'a bildirir. Reklam kampanyalarinin satin alim icin
 * optimize edilebilmesi bu event'e bagli — tutar ve para birimi GERCEK
 * degerler olmali, aksi halde ROAS raporlari yanlis cikar.
 *
 * @param amount   Sayisal tutar (orn. 59.99) — string degil
 * @param currency ISO 4217 kodu (orn. "TRY")
 */
export function logPurchase(
  amount: number,
  currency: string,
  params?: Record<string, string | number>
) {
  if (!AppEventsLogger || !Number.isFinite(amount) || amount <= 0 || !currency) return;
  try {
    AppEventsLogger.logPurchase(amount, currency, params);
  } catch {}
}

/** Genel amacli event — kayit tamamlama, egitim vb. huni adimlari icin. */
export function logEvent(
  name: string,
  params?: Record<string, string | number>
) {
  if (!AppEventsLogger) return;
  try {
    if (params) AppEventsLogger.logEvent(name, params);
    else AppEventsLogger.logEvent(name);
  } catch {}
}

/**
 * Kullaniciyi Facebook event'lerine baglar — ayni kisinin farkli cihazlardaki
 * satin alimlari eslesir, attribution dogrulugu artar.
 */
export function setFacebookUserId(uid: string | null) {
  if (!AppEventsLogger) return;
  try {
    AppEventsLogger.setUserID(uid);
  } catch {}
}
