import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, User } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  birthDate?: string;     // ISO yyyy-mm-dd
  age?: number;           // computed at register, stored for cheap filtering
  gender?: "Erkek" | "Kadın" | "Diğer";
  bio?: string;
  city?: string;
  photos?: string[];
  interests?: string[];
  job?: string;
  height?: number;
  online?: boolean;
  lastActive?: number;    // unix ms
  verified?: boolean;
  vip?: boolean;
  profileComplete: boolean;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDevAdmin: boolean;
  signInAsDevAdmin: () => void;
  signOut: () => Promise<void>;
  updateProfile: (fields: Partial<Omit<UserProfile, "uid" | "email">>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isDevAdmin: false,
  signInAsDevAdmin: () => {},
  signOut: async () => {},
  updateProfile: async () => {},
});

const DEV_ADMIN_USER = {
  uid: "dev-admin-local",
  email: "admin@test.local",
  displayName: "Dev Admin",
  photoURL: null,
} as unknown as User;

const DEV_ADMIN_PROFILE: UserProfile = {
  uid: "dev-admin-local",
  name: "Dev Admin",
  email: "admin@test.local",
  photoURL: "",
  profileComplete: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const isDevAdminRef = useRef(false);
  // Track whether we've received at least one real auth callback with a user.
  // Firebase RN persistence fires null first, then user — we must not set
  // loading=false on the initial null until a grace period passes.
  const hasReceivedUserRef = useRef(false);
  const nullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (__DEV__) console.log("[Auth] onAuthStateChanged →", u ? `uid=${u.uid}` : "null");
      if (isDevAdminRef.current) return;

      if (u) {
        // Clear any pending "no user" timer — a real user arrived
        if (nullTimerRef.current) {
          clearTimeout(nullTimerRef.current);
          nullTimerRef.current = null;
        }
        hasReceivedUserRef.current = true;
        setUser(u);
        // loading stays true until Firestore profile snapshot resolves
      } else {
        if (hasReceivedUserRef.current) {
          // We previously had a user and now got null → real sign-out
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else {
          // First callback is null — might be persistence race.
          // Wait 1.5s: if no user arrives, accept null as real.
          if (!nullTimerRef.current) {
            nullTimerRef.current = setTimeout(() => {
              nullTimerRef.current = null;
              if (!hasReceivedUserRef.current) {
                if (__DEV__) console.log("[Auth] persistence grace expired — no user");
                setUser(null);
                setProfile(null);
                setLoading(false);
              }
            }, 1500);
          }
        }
      }
    });
    return () => {
      unsubscribeAuth();
      if (nullTimerRef.current) clearTimeout(nullTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isDevAdmin) return;
    if (!user) return;
    const unsubscribeDoc = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error("[AuthContext] profile snapshot error:", err);
        setProfile(null);
        setLoading(false);
      },
    );
    return unsubscribeDoc;
  }, [user, isDevAdmin]);

  // Safety: if loading hangs >10s, unblock the router.
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => {
      console.warn("[AuthContext] loading timed out — forcing false");
      setLoading(false);
    }, 10000);
    return () => clearTimeout(t);
  }, [loading]);

  function signInAsDevAdmin() {
    isDevAdminRef.current = true;
    setIsDevAdmin(true);
    setUser(DEV_ADMIN_USER);
    setProfile(DEV_ADMIN_PROFILE);
    setLoading(false);
  }

  async function signOut() {
    if (isDevAdminRef.current) {
      isDevAdminRef.current = false;
      setIsDevAdmin(false);
      setUser(null);
      setProfile(null);
      await fbSignOut(auth).catch(() => {});
      return;
    }
    // Reset the flag so next launch can do the grace period again
    hasReceivedUserRef.current = false;
    await fbSignOut(auth);
  }

  async function updateProfile(fields: Partial<Omit<UserProfile, "uid" | "email">>) {
    if (isDevAdmin) {
      setProfile((prev) => (prev ? { ...prev, ...fields } : prev));
      return;
    }
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), fields as Record<string, unknown>);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isDevAdmin, signInAsDevAdmin, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
