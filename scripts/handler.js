const { verifyToken } = require("../utils/firebase");
const { getRedis } = require("../utils/redis");
const Chat = require("../models/Chat");
const User = require("../models/User");
const { sendPushNotification } = require("../utils/pushNotify");

function setupSocket(io) {
  global._io = io;

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token gerekli"));
    try {
      const decoded = await verifyToken(token);
      socket.uid = decoded.uid;
      next();
    } catch {
      next(new Error("Gecersiz token"));
    }
  });

  io.on("connection", async (socket) => {
    const uid = socket.uid;
    const redis = getRedis();

    await redis.set(`online:${uid}`, "1");
    await User.updateOne({ uid }, { online: true, lastActive: new Date() });
    socket.broadcast.emit("user:online", { uid });
    socket.join(uid);

    // ── Mesaj gonder ──
    socket.on("chat:send", async (data) => {
      try {
        const chatKey = [uid, data.to].sort().join("_");
        const message = {
          senderId: uid,
          text: data.text || "",
          type: data.type || "text",
          status: "delivered",
          imageUrl: data.imageUrl || null,
          gift: data.gift || null,
          sharedPost: data.sharedPost || null,
          storyReply: data.storyReply || null,
          reactions: [],
          createdAt: new Date(),
        };

        // lastMessage icin ozet belirle
        let lastMsgText = data.text || "";
        if (!lastMsgText) {
          if (data.type === "image") lastMsgText = "📷 Fotoğraf";
          else if (data.type === "video") lastMsgText = "🎥 Video";
          else if (data.gift) lastMsgText = "🎁 Hediye";
        }

        const chat = await Chat.findOneAndUpdate(
          { chatKey },
          {
            $setOnInsert: { chatKey, participants: [uid, data.to].sort() },
            $set: {
              lastMessage: lastMsgText,
              lastMessageAt: new Date(),
              lastSenderId: uid,
            },
            $push: { messages: message },
            $inc: { [`unreadCounts.${data.to}`]: 1 },
          },
          { upsert: true, returnDocument: "after" }
        );

        const saved = chat.messages[chat.messages.length - 1];

        const toUnread = chat.unreadCounts instanceof Map
          ? (chat.unreadCounts.get(data.to) || 0)
          : (chat.unreadCounts && chat.unreadCounts[data.to] ? chat.unreadCounts[data.to] : 0);

        // Karsi tarafa emit
        socket.to(data.to).emit("chat:message", {
          chatKey,
          message: saved,
          unreadCount: toUnread,
        });

        // Gonderene emit — status "delivered" olarak gelsin
        socket.emit("chat:message", {
          chatKey,
          message: saved,
          unreadCount: 0,
        });

        // Push notification
        const sender = await User.findOne({ uid }).select("name photoURL photos").lean();
        sendPushNotification({
          toUid: data.to,
          type: data.type === "storyReply" ? "story_reply" : "message",
          fromUid: uid,
          fromName: sender?.name || "",
          fromPhoto: sender?.photoURL || (sender?.photos && sender.photos[0]) || "",
          text: data.text || "",
          storyId: data.storyReply?.storyId,
          storyImageUrl: data.storyReply?.storyImageUrl,
        }).catch(err => console.error("Push error:", err));
      } catch (err) {
        console.error("chat:send error:", err);
      }
    });

    // ── Mesaj okundu ──
    socket.on("chat:read", async (data) => {
      try {
        const { chatKey, readerUid } = data;
        if (!chatKey || !readerUid) return;

        // DB'de unread sifirla
        await Chat.findOneAndUpdate(
          { chatKey },
          { [`unreadCounts.${readerUid}`]: 0 }
        );

        // DB'de mesajlarin status'unu "read" yap
        await Chat.updateOne(
          { chatKey },
          { $set: { "messages.$[elem].status": "read" } },
          { arrayFilters: [{ "elem.senderId": { $ne: readerUid }, "elem.status": { $ne: "read" } }] }
        );

        // Karsi tarafa bildir (gonderenin mesajlari "read" olacak)
        const otherUid = chatKey.split("_").find(u => u !== readerUid);
        if (otherUid) {
          socket.to(otherUid).emit("chat:read", { chatKey, readerUid });
        }
      } catch (err) {
        console.error("chat:read error:", err);
      }
    });

    // ── Emoji reaction ──
    socket.on("chat:reaction", async (data) => {
      try {
        const { chatKey, messageId, emoji, userId } = data;
        if (!chatKey || !messageId || !emoji) return;

        // DB'de reaction'i toggle et
        const chat = await Chat.findOne({ chatKey });
        if (!chat) return;

        const msg = chat.messages.id(messageId);
        if (!msg) return;

        if (!msg.reactions) msg.reactions = [];
        const existIdx = msg.reactions.findIndex(r => r.userId === userId && r.emoji === emoji);
        let remove = false;

        if (existIdx >= 0) {
          // Ayni emoji — kaldir (toggle)
          msg.reactions.splice(existIdx, 1);
          remove = true;
        } else {
          // Farkli emoji olabilir — kullanicinin eski reaction'ini kaldir
          const oldIdx = msg.reactions.findIndex(r => r.userId === userId);
          if (oldIdx >= 0) msg.reactions.splice(oldIdx, 1);
          msg.reactions.push({ emoji, userId });
        }

        await chat.save();

        // Karsi tarafa bildir
        const otherUid = chatKey.split("_").find(u => u !== userId);
        if (otherUid) {
          socket.to(otherUid).emit("chat:reaction", {
            chatKey,
            messageId,
            emoji,
            userId,
            remove,
          });
        }
      } catch (err) {
        console.error("chat:reaction error:", err);
      }
    });

    socket.on("chat:typing", (data) => {
      socket.to(data.to).emit("chat:typing", { from: uid });
    });

    // Uygulama arka plana alındı — online: false, lastActive güncelle
    socket.on("user:goBackground", async () => {
      try {
        await redis.del(`online:${uid}`);
        await User.updateOne({ uid }, { online: false, lastActive: new Date() });
        socket.broadcast.emit("user:offline", { uid, lastActive: new Date() });
      } catch (err) {
        console.error("user:goBackground error:", err);
      }
    });

    // Uygulama ön plana döndü — online: true
    socket.on("user:goForeground", async () => {
      try {
        await redis.set(`online:${uid}`, "1");
        await User.updateOne({ uid }, { online: true, lastActive: new Date() });
        socket.broadcast.emit("user:online", { uid });
      } catch (err) {
        console.error("user:goForeground error:", err);
      }
    });

    socket.on("disconnect", async () => {
      await redis.del(`online:${uid}`);
      await User.updateOne({ uid }, { online: false, lastActive: new Date() });
      socket.broadcast.emit("user:offline", { uid, lastActive: new Date() });
    });
  });
}

module.exports = { setupSocket };
