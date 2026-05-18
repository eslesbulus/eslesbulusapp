import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyB5Rw53SY_CDvJSlrgK0zg7hVlMLG_cTbk",
  authDomain: "eslesbulusapp.firebaseapp.com",
  projectId: "eslesbulusapp",
  storageBucket: "eslesbulusapp.firebasestorage.app",
  messagingSenderId: "321088428409",
  appId: "1:321088428409:web:29e2fb270030d2580177a8",
  measurementId: "G-BNJPM5DVZX",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
