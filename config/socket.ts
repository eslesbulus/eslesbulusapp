import { io, Socket } from "socket.io-client";
import { auth } from "./firebase";

const BASE_URL = "http://178.251.238.228";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  socket = io(BASE_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return new Promise((resolve, reject) => {
    if (!socket) return reject(new Error("Socket null"));

    socket.on("connect", () => {
      if (__DEV__) console.log("[Socket] connected:", socket!.id);
      resolve(socket!);
    });

    socket.on("connect_error", (err) => {
      if (__DEV__) console.error("[Socket] connect error:", err.message);
      reject(err);
    });
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
