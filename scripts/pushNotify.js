const { Expo } = require("expo-server-sdk");
const User = require("../models/User");
const Notification = require("../models/Notification");

const expo = new Expo();

async function sendPushNotification({ toUid, type, fromUid, fromName, fromPhoto, text, storyId, storyImageUrl }) {
  // 1. DB'ye kaydet
  const notif = await Notification.create({
    toUid, type, fromUid, fromName, fromPhoto, text, storyId, storyImageUrl,
  });

  // 2. Socket uzerinden gercek zamanli bildirim emit et (bildirim cani icin)
  if (global._io) {
    global._io.to(toUid).emit("notification", {
      id: notif._id,
      type: notif.type,
      fromUid: notif.fromUid,
      fromName: notif.fromName,
      fromPhoto: notif.fromPhoto,
      text: notif.text,
      read: false,
      createdAt: notif.createdAt,
      storyId: notif.storyId,
      storyImageUrl: notif.storyImageUrl,
    });
  }

  // 3. Push token'lari al
  const targetUser = await User.findOne({ uid: toUid }).lean();
  if (!targetUser || !targetUser.pushTokens || !targetUser.pushTokens.length) return notif;

  // 4. Expo push mesajlari olustur
  const messages = [];
  for (const pt of targetUser.pushTokens) {
    if (!Expo.isExpoPushToken(pt.token)) continue;

    let title = fromName || "EslesBulus";
    let body = text || "";

    switch (type) {
      case "message":
        body = text || "Yeni mesaj";
        break;
      case "like":
        body = fromName + " profilini begendi";
        break;
      case "match":
        title = "Yeni Eslesme!";
        body = fromName + " ile eslestiniz!";
        break;
      case "story_view":
        body = fromName + " hikayene bakti";
        break;
      case "story_reply":
        body = fromName + " hikayene yanit verdi";
        break;
      case "profile_view":
        body = fromName + " profiline bakti";
        break;
      case "hi":
        body = fromName + " sana Hi gonderdi";
        break;
    }

    messages.push({
      to: pt.token,
      sound: "default",
      title,
      body,
      data: { type, fromUid, storyId, senderId: fromUid, userId: fromUid },
      channelId: type === "message" ? "messages" : "default",
    });
  }

  // 5. Batch gonder
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error("Push send error:", err);
    }
  }

  return notif;
}

module.exports = { sendPushNotification };
