const fs = require("fs");
const path = "/var/www/eslesbulus-api/src/routes/admin.js";
let code = fs.readFileSync(path, "utf8");
let changed = 0;

function replace(label, oldStr, newStr) {
  if (code.includes(oldStr)) {
    code = code.replace(oldStr, newStr);
    console.log("OK  " + label);
    changed++;
  } else if (newStr && code.includes(newStr.slice(0, 60))) {
    console.log("SKIP (already) " + label);
  } else {
    console.log("!!  NOT FOUND: " + label);
  }
}

// ── 1) notifications/send — kategoriler + mod (push/inapp/both) ──
const oldNotif = `router.post("/notifications/send", async (req, res) => {
  try {
    const { title, body, target } = req.body;
    // target: "all" | "premium" | { uids: [...] }

    let users;
    if (target === "all") {
      users = await User.find({ "pushTokens.0": { $exists: true } }).select("uid pushTokens name").lean();
    } else if (target === "premium") {
      users = await User.find({ isPremium: true, "pushTokens.0": { $exists: true } }).select("uid pushTokens name").lean();
    } else if (target?.uids) {
      users = await User.find({ uid: { $in: target.uids }, "pushTokens.0": { $exists: true } }).select("uid pushTokens name").lean();
    } else {
      return res.status(400).json({ error: "Gecersiz hedef" });
    }

    let sent = 0;
    for (const user of users) {
      for (const pt of user.pushTokens) {
        try {
          await sendPushNotification({
            toUid: user.uid,
            type: "admin",
            fromUid: "admin",
            fromName: "EslesBulus",
            fromPhoto: "",
            text: body || title || "",
            title: title,
          });
          sent++;
          break; // Kullanici basina 1 bildirim
        } catch {}
      }
    }

    res.json({ ok: true, sent, total: users.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

const newNotif = `router.post("/notifications/send", async (req, res) => {
  try {
    const { title, body, target, uids, mode } = req.body;
    // target: "all" | "male" | "female" | "premium" | "specific"
    // mode:   "push" | "inapp" | "both" (varsayilan both)
    const deliver = mode || "both";

    const filter = { role: { $nin: ["fake-bot", "fake-manual"] } };
    if (target === "male") filter.gender = "Erkek";
    else if (target === "female") filter.gender = { $in: ["Kadın", "Kadin"] };
    else if (target === "premium") filter.isPremium = true;
    else if (target === "specific") {
      if (!Array.isArray(uids) || uids.length === 0) return res.status(400).json({ error: "Kullanici secilmedi" });
      filter.uid = { $in: uids };
    } else if (target !== "all") {
      return res.status(400).json({ error: "Gecersiz hedef" });
    }

    const users = await User.find(filter).select("uid name").lean();

    const skipPush = deliver === "inapp";
    const skipDb = deliver === "push";

    let sent = 0;
    for (const user of users) {
      try {
        await sendPushNotification({
          toUid: user.uid,
          type: "admin",
          fromUid: "admin",
          fromName: "EslesBulus",
          fromPhoto: "",
          text: body || "",
          title: title || "EslesBulus",
          skipPush,
          skipDb,
        });
        sent++;
      } catch (e) { console.error("[notif] send error:", e.message); }
    }

    res.json({ ok: true, sent, total: users.length, mode: deliver, target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;
replace("notifications/send", oldNotif, newNotif);

// ── 2) Gift schema — vip/rarity/giftId alanlari ──
const oldGiftSchema = `  const giftSchema = new mongoose.Schema({
    name:    { type: String, required: true },
    emoji:   { type: String, required: true },
    price:   { type: Number, required: true },
    color:   { type: String, default: "#FF6B6B" },
    active:  { type: Boolean, default: true },
    order:   { type: Number, default: 0 },
  }, { timestamps: true });`;
const newGiftSchema = `  const giftSchema = new mongoose.Schema({
    giftId:  { type: String, default: "" },
    name:    { type: String, required: true },
    emoji:   { type: String, required: true },
    price:   { type: Number, required: true },
    color:   { type: String, default: "#FF6B6B" },
    rarity:  { type: String, default: "common" },
    vip:     { type: Boolean, default: false },
    active:  { type: Boolean, default: true },
    order:   { type: Number, default: 0 },
  }, { timestamps: true });`;
replace("Gift schema", oldGiftSchema, newGiftSchema);

// ── 3) Yeni endpoint'leri module.exports oncesine ekle ──
const anchor = `module.exports = router;`;
const newEndpoints = `// ════════════════════════════════════════════
//  ADMIN: Sohbete mesaj gonder / AI yanit / Hizli cevap
// ════════════════════════════════════════════

// Sohbete mesaj gonder — bir katilimci adina veya sistem mesaji
router.post("/chats/:chatKey/send", async (req, res) => {
  try {
    const { chatKey } = req.params;
    const { senderId, text, asSystem } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ error: "Mesaj gerekli" });

    const chat = await Chat.findOne({ chatKey });
    if (!chat) return res.status(404).json({ error: "Sohbet bulunamadi" });

    const actualSender = asSystem ? "system" : senderId;
    if (!asSystem && !chat.participants.includes(actualSender)) {
      return res.status(400).json({ error: "Gonderen bu sohbetin katilimcisi degil" });
    }

    const message = {
      senderId: actualSender,
      text: text.trim(),
      type: "text",
      status: "sent",
      createdAt: new Date(),
    };
    chat.messages.push(message);
    chat.lastMessage = text.trim();
    chat.lastMessageAt = new Date();
    chat.lastSenderId = actualSender;

    const recipient = chat.participants.find(u => u !== actualSender);
    if (recipient && !asSystem && chat.unreadCounts && typeof chat.unreadCounts.set === "function") {
      const cur = chat.unreadCounts.get(recipient) || 0;
      chat.unreadCounts.set(recipient, cur + 1);
    }
    await chat.save();
    const saved = chat.messages[chat.messages.length - 1];

    if (global._io) {
      for (const p of chat.participants) {
        global._io.to(p).emit("chat:message", { chatKey, message: saved });
      }
    }

    if (recipient && !asSystem) {
      const sender = await User.findOne({ uid: actualSender }).select("name photoURL photos").lean();
      sendPushNotification({
        toUid: recipient,
        type: "message",
        fromUid: actualSender,
        fromName: sender?.name || "",
        fromPhoto: sender?.photoURL || (sender?.photos && sender.photos[0]) || "",
        text: text.trim(),
      }).catch(() => {});
    }

    res.json({ ok: true, message: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sohbet icin AI yanit onerisi uret (gondermez, oneri doner)
router.post("/chats/:chatKey/ai-reply", async (req, res) => {
  try {
    const { chatKey } = req.params;
    const { botUid } = req.body;
    const chat = await Chat.findOne({ chatKey }).lean();
    if (!chat) return res.status(404).json({ error: "Sohbet bulunamadi" });

    const sender = botUid || chat.participants[0];
    const recipient = chat.participants.find(u => u !== sender);
    const lastIncoming = [...chat.messages].reverse().find(m => m.senderId === recipient);
    const lastText = lastIncoming?.text || "Merhaba";

    const bot = await User.findOne({ uid: sender }).select("name age city").lean();
    const realUser = await User.findOne({ uid: recipient }).select("name").lean();

    const { getBotResponse } = require("../utils/botAI");
    const { getSettings } = require("../middleware/maintenance");
    const settings = await getSettings();

    const response = await getBotResponse({
      senderId: recipient,
      receiverId: sender,
      message: lastText,
      dialog: chatKey,
      botDetails: { bot_isim: bot?.name || "Bot", bot_yas: String(bot?.age || 24), bot_sehir: bot?.city || "Istanbul" },
      userName: realUser?.name || "Kullanici",
      apiUrl: settings.botApiUrl,
      apiKey: settings.botApiKey,
    });

    if (!response) return res.json({ error: "AI yanit uretemedi" });
    res.json({ ok: true, suggestion: response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hizli cevap sablonlari (canned responses)
let QuickReply;
try {
  QuickReply = mongoose.model("QuickReply");
} catch {
  const qrSchema = new mongoose.Schema({
    text:     { type: String, required: true },
    category: { type: String, default: "genel" },
    order:    { type: Number, default: 0 },
  }, { timestamps: true });
  QuickReply = mongoose.model("QuickReply", qrSchema);
}

router.get("/quick-replies", async (req, res) => {
  try {
    const replies = await QuickReply.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({ replies });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/quick-replies", async (req, res) => {
  try {
    if (!req.body.text) return res.status(400).json({ error: "Metin gerekli" });
    const r = await QuickReply.create({ text: req.body.text, category: req.body.category || "genel" });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/quick-replies/:id", async (req, res) => {
  try {
    await QuickReply.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Manuel bot sohbetleri — fake-manual botlarin oldugu sohbetler
router.get("/manual-bot-chats", async (req, res) => {
  try {
    const bots = await User.find({ role: "fake-manual" }).select("uid name photoURL").lean();
    const botUids = bots.map(b => b.uid);
    const botMap = {}; bots.forEach(b => { botMap[b.uid] = b; });
    if (botUids.length === 0) return res.json({ chats: [], bots: [] });

    const chats = await Chat.find({ participants: { $in: botUids } })
      .sort({ lastMessageAt: -1 })
      .limit(300)
      .lean();

    const otherUids = [...new Set(chats.map(c => c.participants.find(u => !botUids.includes(u))).filter(Boolean))];
    const others = await User.find({ uid: { $in: otherUids } }).select("uid name photoURL online").lean();
    const otherMap = {}; others.forEach(u => { otherMap[u.uid] = u; });

    const result = chats.map(c => {
      const botUid = c.participants.find(u => botUids.includes(u));
      const otherUid = c.participants.find(u => !botUids.includes(u));
      const unread = c.unreadCounts && c.unreadCounts[botUid] ? c.unreadCounts[botUid] : 0;
      return {
        chatKey: c.chatKey,
        bot: botMap[botUid] || { uid: botUid, name: "Bot" },
        user: otherMap[otherUid] || { uid: otherUid, name: "Bilinmeyen" },
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        lastSenderId: c.lastSenderId,
        unread,
        waitingReply: c.lastSenderId === otherUid,
      };
    });

    res.json({ chats: result, bots });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;`;
replace("new endpoints", anchor, newEndpoints);

fs.writeFileSync(path, code);
console.log("\\nTotal changes: " + changed);
