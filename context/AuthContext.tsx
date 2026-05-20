import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, User } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  birthDate?: string;
  gender?: string;
  bio?: string;
  city?: string;
  photos?: string[];
  interests?: string[];
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
  // Ref so the onAuthStateChanged closure always sees the latest value
  // without needing to re-subscribe every time isDevAdmin changes.
  const isDevAdminRef = useRef(false);

  useEffect(() => {
    // Single subscription that lives for the lifetime of the provider.
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (isDevAdminRef.current) return;
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []); // no deps — ref keeps it fresh without re-subscribing

  useEffect(() => {
    if (isDevAdmin) return;
    if (!user) return;
    const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribeDoc;
  }, [user, isDevAdmin]);

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
      // Also clear any real Firebase session that may be persisted
      await fbSignOut(auth).catch(() => {});
      return;
    }
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
