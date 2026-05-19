import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/config/firebase";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  birthDate?: string;
  gender?: string;
  bio?: string;
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
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isDevAdmin: false,
  signInAsDevAdmin: () => {},
  signOut: async () => {},
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (isDevAdmin) return;
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, [isDevAdmin]);

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
    setIsDevAdmin(true);
    setUser(DEV_ADMIN_USER);
    setProfile(DEV_ADMIN_PROFILE);
    setLoading(false);
  }

  async function signOut() {
    if (isDevAdmin) {
      setIsDevAdmin(false);
      setUser(null);
      setProfile(null);
      return;
    }
    await fbSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isDevAdmin, signInAsDevAdmin, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
