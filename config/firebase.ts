import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth } from "firebase/auth";
// @ts-ignore — getReactNativePersistence v12 type def'te yok ama RN runtime'da var (Metro "react-native" condition)
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyB5Rw53SY_CDvJSlrgK0zg7hVlMLG_cTbk",
  authDomain: "eslesbulusapp.firebaseapp.com",
  projectId: "eslesbulusapp",
  storageBucket: "eslesbulusapp.firebasestorage.app",
  messagingSenderId: "321088428409",
  appId: "1:321088428409:web:29e2fb270030d2580177a8",
  measurementId: "G-BNJPM5DVZX",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

let auth: ReturnType<typeof initializeAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app) as any;
}
export { auth };
