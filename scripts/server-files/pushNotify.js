const { Expo } = require("expo-server-sdk");
const User = require("../models/User");
const Notification = require("../models/Notification");

const expo = new Expo();

/**
 * Bildirim gonder.
 * @param {Object} opts
 * @param {string} opts.toUid
 * @param {string} opts.type
 * @param {string} opts.fromUid
 * @param {string} [opts.fromName]
 * @param {string} [opts.fromPhoto]
 * @param {string} [opts.text]
 * @param {string} [opts.title]      ozel baslik (admin bildirimleri icin)
 * @param {boolean} [opts.skipPush]  true ise sadece uygulama ici (DB + socket), push gonderilmez
 * @param {boolean} [opts.skipDb]    true ise sadece push, uygulama ici kayit/socket olmaz
 */
async function sendPushNotification({ toUid, type, fromUid, fromName, fromPhoto, text, storyId, storyImageUrl, title: customTitle, skipPush, skipDb }) {
  let notif = null;

  // 1. Uygulama ici (DB kaydi + socket) — skipDb degilse
  if (!skipDb) {
    notif = await Notification.create({
      toUid, type, fromUid, fromName, fromPhoto, text, title: customTitle || "", storyId, storyImageUrl,
    });

    if (global._io) {
      global._io.to(toUid).emit("notification", {
        id: notif._id,
        type: notif.type,
        fromUid: notif.fromUid,
        fromName: notif.fromName,
        fromPhoto: notif.fromPhoto,
        text: notif.text,
        title: notif.title,
        read: false,
        createdAt: notif.createdAt,
        storyId: notif.storyId,
        storyImageUrl: notif.storyImageUrl,
      });
    }
  }

  // 2. Push gonder — skipPush degilse
  if (skipPush) return notif;

  const targetUser = await User.findOne({ uid: toUid }).lean();
  if (!targetUser || !targetUser.pushTokens || !targetUser.pushTokens.length) return notif;

  const messages = [];
  for (const pt of targetUser.pushTokens) {
    if (!Expo.isExpoPushToken(pt.token)) continue;

    let title = customTitle || fromName || "EslesBulus";
    let body = text || "";

    switch (type) {
      case "message":
        body = text || "Yeni mesaj";
        break;
      case "like":
        body = fromName + " profilini begendi";
        break;
      case "match":
        title = customTitle || "Yeni Eslesme!";
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
      case "admin":
      case "announcement":
      case "system":
        title = customTitle || "EslesBulus";
        body = text || "";
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
