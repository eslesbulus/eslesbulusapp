const fs = require("fs");
const path = "/var/www/eslesbulus-api/src/routes/chats.js";
let code = fs.readFileSync(path, "utf8");

const oldEndpoint = `router.get("/:otherUid/messages", authRequired, async (req, res) => {
  const chatKey = [req.uid, req.params.otherUid].sort().join("_");
  const chat = await Chat.findOne({ chatKey }).lean();
  if (!chat) return res.json([]);
  res.json(chat.messages || []);
});`;

const newEndpoint = `router.get("/:otherUid/messages", authRequired, async (req, res) => {
  const chatKey = [req.uid, req.params.otherUid].sort().join("_");
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before ? new Date(req.query.before).getTime() : null;
  const chat = await Chat.findOne({ chatKey }).lean();
  if (!chat) return res.json([]);
  let msgs = chat.messages || [];
  if (before && !isNaN(before)) {
    // 'before' zamanindan ESKI mesajlar (lazy loading — yukari kaydirinca)
    msgs = msgs.filter((m) => new Date(m.createdAt).getTime() < before);
  }
  // Son 'limit' mesaji dondur (en yeniler), kronolojik sirada
  const page = msgs.slice(-limit);
  res.json(page);
});`;

if (code.includes("const limit = Math.min(parseInt(req.query.limit)")) {
  console.log("chats.js pagination already patched");
} else if (code.includes(oldEndpoint)) {
  code = code.replace(oldEndpoint, newEndpoint);
  fs.writeFileSync(path, code);
  console.log("chats.js messages pagination patched OK");
} else {
  console.log("!! endpoint pattern not found - manual check needed");
}
