import { io, Socket } from "socket.io-client";
import { auth } from "./firebase";

const BASE_URL = "https://api.eslesbulus.com";

let socket: Socket | null = null;
let isConnecting = false;

export function getSocket(): Socket | null {
  return socket;
}

export async function connectSocket(): Promise<Socket> {
  // Zaten bağlıysa tekrar bağlanma
  if (socket?.connected) return socket;

  // Birden fazla eşzamanlı bağlantı girişimini engelle
  if (isConnecting && socket) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Connect timeout")), 10000);
      socket!.once("connect", () => {
        clearTimeout(timeout);
        resolve(socket!);
      });
      socket!.once("connect_error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  isConnecting = true;
  const token = await user.getIdToken(true); // force refresh

  // Eski socket varsa temizle
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(BASE_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity, // Sonsuz yeniden deneme
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000, // Max 15sn bekle
    randomizationFactor: 0.3,
    timeout: 15000,
  });

  // Token expire olunca yeni token ile yeniden bağlan
  socket.on("connect_error", async (err) => {
    const msg = err.message || "";
    // Token geçersizse yenile
    if (msg.includes("token") || msg.includes("Token") || msg.includes("auth")) {
      try {
        const freshUser = auth.currentUser;
        if (freshUser) {
          const newToken = await freshUser.getIdToken(true);
          if (socket) {
            socket.auth = { token: newToken };
          }
        }
      } catch {
        // Token yenileme başarısız — socket kendi reconnect'i deneyecek
      }
    }
    // Sadece ilk hatada log bas, tekrarlayan reconnect hataları sessiz
  });

  return new Promise((resolve, reject) => {
    if (!socket) {
      isConnecting = false;
      return reject(new Error("Socket null"));
    }

    const connectTimeout = setTimeout(() => {
      isConnecting = false;
      reject(new Error("Socket connect timeout"));
    }, 15000);

    socket.once("connect", () => {
      clearTimeout(connectTimeout);
      isConnecting = false;
      if (__DEV__) console.log("[Socket] connected:", socket!.id);
      resolve(socket!);
    });

    socket.once("connect_error", (err) => {
      clearTimeout(connectTimeout);
      isConnecting = false;
      if (__DEV__) console.log("[Socket] initial connect failed, will retry:", err.message);
      // İlk bağlantı hatası — reject etme, socket kendi reconnect edecek
      // Ama çağıranın beklemesini bitirmesi lazım
      resolve(socket!);
    });
  });
}

export function disconnectSocket() {
  isConnecting = false;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
