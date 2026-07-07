import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { onAuthStateChanged, signOut as fbSignOut, User } from "firebase/auth";
import { auth } from "@/config/firebase";
import { api } from "@/config/api";
import { connectSocket, disconnectSocket, getSocket } from "@/config/socket";

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  birthDate?: string;
  age?: number;
  gender?: "Erkek" | "Kadın" | "Diğer";
  bio?: string;
  city?: string;
  photos?: string[];
  interests?: string[];
  job?: string;
  height?: number;
  online?: boolean;
  lastActive?: number;
  verified?: boolean;
  vip?: boolean;
  profileComplete: boolean;
  // Hesap doğrulama (selfie ile) — admin onaylı
  verificationStatus?: "none" | "pending" | "approved" | "rejected";
  verificationPhoto?: string;
  verificationSubmittedAt?: string | null;
  verificationNote?: string;
  // Premium
  isPremium?: boolean;
  premiumExpiry?: string | null;
  // Coins
  tokens?: number;
  // Daily limits
  dailyLikesUsed?: number;
  dailyHisUsed?: number;
  dailyStoryLikesUsed?: number;
  dailyResetDate?: string;
};

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDevAdmin: boolean;
  signInAsDevAdmin: () => void;
  signOut: () => Promise<void>;
  updateProfile: (fields: Partial<Omit<UserProfile, "uid" | "email">>) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isDevAdmin: false,
  signInAsDevAdmin: () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
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
  const hasReceivedUserRef = useRef(false);
  const nullTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (__DEV__) console.log("[Auth] onAuthStateChanged →", u ? `uid=${u.uid}` : "null");
      if (isDevAdminRef.current) return;

      if (u) {
        if (nullTimerRef.current) {
          clearTimeout(nullTimerRef.current);
          nullTimerRef.current = null;
        }
        hasReceivedUserRef.current = true;
        setUser(u);
      } else {
        if (hasReceivedUserRef.current) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          disconnectSocket();
        } else {
          if (!nullTimerRef.current) {
            nullTimerRef.current = setTimeout(() => {
              nullTimerRef.current = null;
              if (!hasReceivedUserRef.current) {
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

  // Fetch profile from API when user is set
  useEffect(() => {
    if (isDevAdmin) return;
    if (!user) return;

    let cancelled = false;

    async function fetchProfile() {
      // Ağ hatasında bir kez deneyip pes etmek yerine artan beklemeyle tekrar dene.
      // Böylece arkadaşının bağlantısı ilk anda takılırsa oturum kalıcı bozulmaz;
      // ağ gelince profil kendiliğinden yüklenir. profile=null YAPMIYORUZ —
      // aksi halde kullanıcı yanlışlıkla onboarding'e atılabilir.
      let attempt = 0;
      while (!cancelled) {
        try {
          const data = await api.post<{ uid: string; profile: UserProfile }>("/api/auth/verify");
          if (!cancelled) {
            setProfile(data.profile);
            setLoading(false);
            // Connect Socket.IO
            connectSocket().catch(() => {
              // Socket reconnect otomatik, ilk bağlantı hatası sessiz
            });
          }
          return; // başarılı
        } catch (err) {
          attempt++;
          if (__DEV__) console.warn(`[Auth] fetch profile error (deneme ${attempt}):`, err);
          // Artan bekleme: 1s, 2s, 4s, 8s… (max 10s). loading'i güvenlik timeout'u yönetir.
          const wait = Math.min(1000 * 2 ** (attempt - 1), 10000);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [user, isDevAdmin]);

  // Admin doğrulama onay/red anında yansısın — socket üzerinden dinle.
  // Backend admin PATCH /verifications/:uid işleminde `verification:update` emit ediyor.
  useEffect(() => {
    if (!user || isDevAdmin) return;

    const handler = (data: { status: string; verified: boolean; note?: string }) => {
      setProfile((prev) => prev ? {
        ...prev,
        verified: !!data.verified,
        verificationStatus: (data.status as UserProfile["verificationStatus"]) ?? prev.verificationStatus,
        verificationNote: data.note ?? prev.verificationNote,
      } : prev);
      if (data.status === "approved") {
        Alert.alert("Hesabın Doğrulandı ✓", "Tebrikler! Profilinde onay rozeti gösteriliyor.");
      } else if (data.status === "rejected") {
        Alert.alert(
          "Doğrulama Reddedildi",
          data.note ? `Sebep: ${data.note}` : "Kurallara uygun yeni bir selfie ile tekrar deneyebilirsin."
        );
      }
    };

    // Socket her an yeniden bağlanabilir; polling ile dinleyiciyi güncel tut.
    let attached: any = null;
    const attach = () => {
      const s = getSocket();
      if (s && s !== attached) {
        if (attached) attached.off("verification:update", handler);
        s.off("verification:update", handler);
        s.on("verification:update", handler);
        attached = s;
      }
    };
    attach();
    const interval = setInterval(attach, 2000);
    return () => {
      clearInterval(interval);
      if (attached) attached.off("verification:update", handler);
    };
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
    disconnectSocket();
    if (isDevAdminRef.current) {
      isDevAdminRef.current = false;
      setIsDevAdmin(false);
      setUser(null);
      setProfile(null);
      await fbSignOut(auth).catch(() => {});
      return;
    }
    hasReceivedUserRef.current = false;
    await fbSignOut(auth);
  }

  async function updateProfile(fields: Partial<Omit<UserProfile, "uid" | "email">>) {
    if (isDevAdmin) {
      setProfile((prev) => (prev ? { ...prev, ...fields } : prev));
      return;
    }
    if (!user) return;
    const updated = await api.put<UserProfile>("/api/users/me", fields);
    setProfile(updated);
  }

  async function refreshProfile() {
    if (isDevAdmin || !user) return;
    try {
      const data = await api.post<{ uid: string; profile: UserProfile }>("/api/auth/verify");
      setProfile(data.profile);
    } catch {}
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, isDevAdmin, signInAsDevAdmin, signOut, updateProfile, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
