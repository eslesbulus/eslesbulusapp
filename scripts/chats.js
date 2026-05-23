const router = require("express").Router();
const { authRequired } = require("../middleware/auth");
const Chat = require("../models/Chat");

// GET /api/chats — aktif sohbetler
router.get("/", authRequired, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.uid,
      archived: { $ne: req.uid },
    })
      .select("-messages")
      .sort({ lastMessageAt: -1 })
      .lean();

    const result = chats.map(c => ({
      ...c,
      unreadCount: c.unreadCounts instanceof Map
        ? (c.unreadCounts.get(req.uid) || 0)
        : (c.unreadCounts && c.unreadCounts[req.uid] ? c.unreadCounts[req.uid] : 0),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats/archived — arsivlenmis sohbetler
router.get("/archived", authRequired, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.uid,
      archived: req.uid,
    })
      .select("-messages")
      .sort({ lastMessageAt: -1 })
      .lean();

    const result = chats.map(c => ({
      ...c,
      unreadCount: c.unreadCounts instanceof Map
        ? (c.unreadCounts.get(req.uid) || 0)
        : (c.unreadCounts && c.unreadCounts[req.uid] ? c.unreadCounts[req.uid] : 0),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chats/:otherUid/messages
router.get("/:otherUid/messages", authRequired, async (req, res) => {
  const chatKey = [req.uid, req.params.otherUid].sort().join("_");
  const chat = await Chat.findOne({ chatKey }).lean();
  if (!chat) return res.json([]);
  res.json(chat.messages || []);
});

// POST /api/chats/:otherUid/messages — HTTP fallback (socket yoksa)
router.post("/:otherUid/messages", authRequired, async (req, res) => {
  try {
    const otherUid = req.params.otherUid;
    const chatKey = [req.uid, otherUid].sort().join("_");
    const message = {
      senderId: req.uid,
      text: req.body.text || "",
      type: req.body.type || "text",
      status: "sent",
      createdAt: new Date(),
    };

    const chat = await Chat.findOneAndUpdate(
      { chatKey },
      {
        $setOnInsert: { chatKey, participants: [req.uid, otherUid].sort() },
        $set: {
          lastMessage: req.body.text || "",
          lastMessageAt: new Date(),
          lastSenderId: req.uid,
        },
        $push: { messages: message },
        $inc: { [`unreadCounts.${otherUid}`]: 1 },
      },
      { upsert: true, returnDocument: "after" }
    );

    const saved = chat.messages[chat.messages.length - 1];

    // Socket ile bildir
    if (global._io) {
      global._io.to(otherUid).emit("chat:message", { chatKey, message: saved });
      global._io.to(req.uid).emit("chat:message", { chatKey, message: saved });
    }

    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/:otherUid/read
router.post("/:otherUid/read", authRequired, async (req, res) => {
  try {
    const chatKey = [req.uid, req.params.otherUid].sort().join("_");
    await Chat.findOneAndUpdate(
      { chatKey },
      { [`unreadCounts.${req.uid}`]: 0 }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/:otherUid/delete-messages — mesaj silme
router.post("/:otherUid/delete-messages", authRequired, async (req, res) => {
  try {
    const otherUid = req.params.otherUid;
    const chatKey = [req.uid, otherUid].sort().join("_");
    const { messageIds, mode } = req.body; // mode: "me" veya "all"
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: "messageIds required" });
    }

    const chat = await Chat.findOne({ chatKey });
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    if (mode === "all") {
      // Herkesten sil: mesaj text'ini "Bu mesaj silindi" yap
      chat.messages = chat.messages.map(m => {
        if (messageIds.includes(m._id.toString())) {
          m.text = "Bu mesaj silindi";
          m.type = "text";
          m.gift = null;
          m.sharedPost = null;
          m.storyReply = null;
          m.deleted = true;
        }
        return m;
      });
      await chat.save();

      // Karsi tarafa bildir
      if (global._io) {
        global._io.to(otherUid).emit("chat:messages-deleted", {
          chatKey,
          messageIds,
          mode: "all",
        });
      }
    } else {
      // Benden sil: kullanicinin deletedMessages listesine ekle
      await Chat.findOneAndUpdate(
        { chatKey },
        { $addToSet: { [`deletedMessages.${req.uid}`]: { $each: messageIds } } }
      );
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chats/:otherUid
router.delete("/:otherUid", authRequired, async (req, res) => {
  try {
    const chatKey = [req.uid, req.params.otherUid].sort().join("_");
    await Chat.findOneAndDelete({ chatKey });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/:otherUid/archive
router.post("/:otherUid/archive", authRequired, async (req, res) => {
  try {
    const chatKey = [req.uid, req.params.otherUid].sort().join("_");
    await Chat.findOneAndUpdate(
      { chatKey },
      { $addToSet: { archived: req.uid } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chats/:otherUid/unarchive
router.post("/:otherUid/unarchive", authRequired, async (req, res) => {
  try {
    const chatKey = [req.uid, req.params.otherUid].sort().join("_");
    await Chat.findOneAndUpdate(
      { chatKey },
      { $pull: { archived: req.uid } }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
