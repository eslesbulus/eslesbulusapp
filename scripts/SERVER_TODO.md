# Sunucu Tarafinda Yapilacaklar

Sunucu erisime acilinca asagidaki islemleri yapacagiz.
Tum dosyalar /var/www/eslesbulus-api/ altinda.

---

## 1. Notification Modeli Olustur
**Dosya:** `src/models/Notification.js`

```js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  toUid: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ["message", "like", "match", "story_view", "story_reply", "profile_view", "hi"],
    required: true,
  },
  fromUid: { type: String, required: true },
  fromName: { type: String, default: "" },
  fromPhoto: { type: String, default: "" },
  text: { type: String, default: "" },
  read: { type: Boolean, default: false },
  storyId: String,
  storyImageUrl: String,
}, { timestamps: true });

// 90 gun sonra otomatik sil
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 });

module.exports = mongoose.model("Notification", notificationSchema);
```

---

## 2. Notification Route'lari Olustur
**Dosya:** `src/routes/notifications.js`

```js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Bildirimleri listele
router.get("/api/notifications", async (req, res) => {
  try {
    const list = await Notification.find({ toUid: req.user.uid })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    res.json(list.map(n => ({
      id: n._id,
      type: n.type,
      fromUid: n.fromUid,
      fromName: n.fromName,
      fromPhoto: n.fromPhoto,
      text: n.text,
      read: n.read,
      createdAt: n.createdAt,
      storyId: n.storyId,
      storyImageUrl: n.storyImageUrl,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tumunu okundu isaretle
router.post("/api/notifications/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ toUid: req.user.uid, read: false }, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tekini okundu isaretle
router.post("/api/notifications/:id/read", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

## 3. Chat Route'larina Eksik Endpoint'leri Ekle
**Dosya:** `src/routes/chats.js` (mevcut dosyaya ekle)

```js
// Mark chat as read
router.post("/api/chats/:otherUid/read", async (req, res) => {
  try {
    const myUid = req.user.uid;
    const otherUid = req.params.otherUid;
    const chatKey = [myUid, otherUid].sort().join("_");
    
    await Chat.findOneAndUpdate(
      { chatKey },
      { [`unreadCounts.${myUid}`]: 0 }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete chat
router.delete("/api/chats/:otherUid", async (req, res) => {
  try {
    const myUid = req.user.uid;
    const otherUid = req.params.otherUid;
    const chatKey = [myUid, otherUid].sort().join("_");
    
    await Chat.findOneAndDelete({ chatKey });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive chat
router.post("/api/chats/:otherUid/archive", async (req, res) => {
  try {
    const myUid = req.user.uid;
    const otherUid = req.params.otherUid;
    const chatKey = [myUid, otherUid].sort().join("_");
    
    await Chat.findOneAndUpdate(
      { chatKey },
      { $addToSet: { archived: myUid } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## 4. Chat Modeline unreadCounts ve archived Ekle
**Dosya:** `src/models/Chat.js`

```
participants alaninin altina ekle:
  unreadCounts: { type: Map, of: Number, default: new Map() },
  archived: { type: [String], default: [] },
```

---

## 5. GET /api/chats Endpoint'inde unreadCount Dondur
Mevcut GET /api/chats handler'inda her chat icin `unreadCount` dondur:

```js
// Her chat objesine ekle:
unreadCount: chat.unreadCounts?.get(myUid) || 0
```

---

## 6. User Modeline pushToken Ekle
**Dosya:** `src/models/User.js`

```
pushTokens: [{ token: String, platform: String, updatedAt: { type: Date, default: Date.now } }],
```

---

## 7. Push Token Kayit Endpoint'i
**Dosya:** `src/routes/users.js` (mevcut dosyaya ekle)

```js
router.post("/api/users/me/push-token", async (req, res) => {
  try {
    const { token, platform } = req.body;
    const uid = req.user.uid;
    
    // Eski ayni token'i kaldir, yenisini ekle
    await User.findOneAndUpdate(
      { uid },
      {
        $pull: { pushTokens: { token } },
      }
    );
    await User.findOneAndUpdate(
      { uid },
      {
        $push: {
          pushTokens: {
            $each: [{ token, platform, updatedAt: new Date() }],
            $slice: -5, // max 5 cihaz
          },
        },
      }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## 8. Push Bildirim Gonderme Yardimci Fonksiyonu
**Dosya:** `src/utils/pushNotify.js` (yeni)

```js
const { Expo } = require("expo-server-sdk");
const User = require("../models/User");
const Notification = require("../models/Notification");

const expo = new Expo();

async function sendPushNotification({ toUid, type, fromUid, fromName, fromPhoto, text, storyId, storyImageUrl }) {
  // 1. DB'ye kaydet
  const notif = await Notification.create({
    toUid, type, fromUid, fromName, fromPhoto, text, storyId, storyImageUrl,
  });
  
  // 2. Push token'lari al
  const targetUser = await User.findOne({ uid: toUid }).lean();
  if (!targetUser?.pushTokens?.length) return notif;
  
  // 3. Expo push mesajlari olustur
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
        body = `${fromName} profilini begendi`;
        break;
      case "match":
        title = "Yeni Eslesme!";
        body = `${fromName} ile eslestiniz!`;
        break;
      case "story_view":
        body = `${fromName} hikayene bakti`;
        break;
      case "story_reply":
        body = `${fromName} hikayene yanit verdi`;
        break;
      case "profile_view":
        body = `${fromName} profiline bakti`;
        break;
      case "hi":
        body = `${fromName} sana Hi gonderdi`;
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
  
  // 4. Batch gonder
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
```

---

## 9. Socket Handler'da Push Bildirim Tetikle
**Dosya:** `src/socket/handler.js`

Mesaj kaydettikten sonra:
```js
const { sendPushNotification } = require("../utils/pushNotify");

// chat:send handler icinde, mesaj kaydedildikten sonra:
sendPushNotification({
  toUid: data.to,
  type: data.type === "storyReply" ? "story_reply" : "message",
  fromUid: uid,
  fromName: senderUser?.name || "",
  fromPhoto: senderUser?.photoURL || senderUser?.photos?.[0] || "",
  text: data.text,
  storyId: data.storyReply?.storyId,
  storyImageUrl: data.storyReply?.storyImageUrl,
}).catch(err => console.error("Push error:", err));
```

---

## 10. Socket Handler'da unreadCount Artir
Mesaj kayit sorgusuna `$inc` ekle:
```js
// findOneAndUpdate icerisindeki $push ile birlikte:
$inc: { [`unreadCounts.${data.to}`]: 1 }
```

---

## 11. server.js'e Notification Route Ekle
```js
const notificationsRoutes = require("./routes/notifications");
app.use(notificationsRoutes);
```

---

## 12. expo-server-sdk Yukle
```bash
cd /var/www/eslesbulus-api && npm install expo-server-sdk
```

---

## 13. Diger Event'lerde Push Bildirim
- Begeni yapildiginda (users.js - like endpoint)
- Profil goruntuleme (users.js - view endpoint)  
- Hi gonderme (interactions route)
- Hikaye goruntulendiginde (stories route)

Her birinde `sendPushNotification()` cagir.
