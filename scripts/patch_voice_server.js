const fs = require("fs");

// ─────────────────────────────────────────────
// 1) upload.js — allow audio files
// ─────────────────────────────────────────────
const uploadPath = "/var/www/eslesbulus-api/src/routes/upload.js";
let up = fs.readFileSync(uploadPath, "utf8");

// fileFilter — add audio detection
const oldFilter = `    const isVideo = /\\.(mp4|mov|avi|mkv|webm)$/i.test(file.originalname) ||
                    file.mimetype.startsWith("video/");
    cb(null, isImage || isVideo);`;
const newFilter = `    const isVideo = /\\.(mp4|mov|avi|mkv|webm)$/i.test(file.originalname) ||
                    file.mimetype.startsWith("video/");
    const isAudio = /\\.(m4a|mp3|wav|aac|ogg|caf|3gp|amr)$/i.test(file.originalname) ||
                    file.mimetype.startsWith("audio/");
    cb(null, isImage || isVideo || isAudio);`;
if (up.includes(oldFilter)) {
  up = up.replace(oldFilter, newFilter);
  console.log("upload.js fileFilter patched");
} else if (up.includes("isAudio")) {
  console.log("upload.js fileFilter already patched");
} else {
  console.log("!! upload.js fileFilter pattern not found");
}

// handler — branch for audio (save raw, no sharp)
const oldVideoBranch = `  const isVideo = req.file.mimetype.startsWith("video/");

  if (isVideo) {`;
const newVideoBranch = `  const isVideo = req.file.mimetype.startsWith("video/") ||
                  /\\.(mp4|mov|avi|mkv|webm)$/i.test(req.file.originalname);
  const isAudio = req.file.mimetype.startsWith("audio/") ||
                  /\\.(m4a|mp3|wav|aac|ogg|caf|3gp|amr)$/i.test(req.file.originalname);

  if (isAudio) {
    // Audio — direkt kaydet (transcode yok)
    const ext = path.extname(req.file.originalname) || ".m4a";
    const filename = \`\${req.uid}_\${Date.now()}\${ext}\`;
    const filepath = path.join(dir, filename);
    fs.writeFileSync(filepath, req.file.buffer);
    const url = \`\${process.env.BASE_URL}/uploads/\${folder}/\${filename}\`;
    return res.json({ url, filename, type: "audio" });
  }

  if (isVideo) {`;
if (up.includes(oldVideoBranch)) {
  up = up.replace(oldVideoBranch, newVideoBranch);
  console.log("upload.js handler patched");
} else if (up.includes('type: "audio"')) {
  console.log("upload.js handler already patched");
} else {
  console.log("!! upload.js handler pattern not found");
}

fs.writeFileSync(uploadPath, up);

// ─────────────────────────────────────────────
// 2) Chat.js model — add audio type + fields
// ─────────────────────────────────────────────
const modelPath = "/var/www/eslesbulus-api/src/models/Chat.js";
let cm = fs.readFileSync(modelPath, "utf8");

const oldType = `  type:      { type: String, enum: ["text", "gift", "image", "video", "sharedPost", "storyReply"], default: "text" },`;
const newType = `  type:      { type: String, enum: ["text", "gift", "image", "video", "audio", "sharedPost", "storyReply"], default: "text" },`;
if (cm.includes(oldType)) {
  cm = cm.replace(oldType, newType);
  console.log("Chat.js type enum patched");
} else if (cm.includes('"audio"')) {
  console.log("Chat.js type enum already patched");
} else {
  console.log("!! Chat.js type enum pattern not found");
}

const oldImageUrl = `  imageUrl:  { type: String, default: null },`;
const newImageUrl = `  imageUrl:  { type: String, default: null },
  audioUrl:  { type: String, default: null },
  audioDuration: { type: Number, default: 0 },`;
if (cm.includes(oldImageUrl) && !cm.includes("audioUrl")) {
  cm = cm.replace(oldImageUrl, newImageUrl);
  console.log("Chat.js audio fields added");
} else if (cm.includes("audioUrl")) {
  console.log("Chat.js audio fields already present");
} else {
  console.log("!! Chat.js imageUrl pattern not found");
}

fs.writeFileSync(modelPath, cm);

// ─────────────────────────────────────────────
// 3) socket/handler.js — persist audio fields + lastMessage
// ─────────────────────────────────────────────
const sockPath = "/var/www/eslesbulus-api/src/socket/handler.js";
let sk = fs.readFileSync(sockPath, "utf8");

const oldMsg = `          type: data.type || "text",
          status: "delivered",
          imageUrl: data.imageUrl || null,`;
const newMsg = `          type: data.type || "text",
          status: "delivered",
          imageUrl: data.imageUrl || null,
          audioUrl: data.audioUrl || null,
          audioDuration: data.audioDuration || 0,`;
if (sk.includes(oldMsg)) {
  sk = sk.replace(oldMsg, newMsg);
  console.log("handler.js message fields patched");
} else if (sk.includes("audioUrl: data.audioUrl")) {
  console.log("handler.js message fields already patched");
} else {
  console.log("!! handler.js message pattern not found");
}

const oldLast = `          if (data.type === "image") lastMsgText = "📷 Fotoğraf";
          else if (data.type === "video") lastMsgText = "🎥 Video";
          else if (data.gift) lastMsgText = "🎁 Hediye";`;
const newLast = `          if (data.type === "image") lastMsgText = "📷 Fotoğraf";
          else if (data.type === "video") lastMsgText = "🎥 Video";
          else if (data.type === "audio") lastMsgText = "🎤 Sesli mesaj";
          else if (data.gift) lastMsgText = "🎁 Hediye";`;
if (sk.includes(oldLast)) {
  sk = sk.replace(oldLast, newLast);
  console.log("handler.js lastMessage patched");
} else if (sk.includes('"🎤 Sesli mesaj"')) {
  console.log("handler.js lastMessage already patched");
} else {
  console.log("!! handler.js lastMessage pattern not found");
}

fs.writeFileSync(sockPath, sk);

// ─────────────────────────────────────────────
// 4) chats.js HTTP fallback — add audio fields
// ─────────────────────────────────────────────
const chatsPath = "/var/www/eslesbulus-api/src/routes/chats.js";
let ch = fs.readFileSync(chatsPath, "utf8");

const oldHttp = `    const message = {
      senderId: req.uid,
      text: req.body.text || "",
      type: req.body.type || "text",
      status: "sent",
      createdAt: new Date(),
    };`;
const newHttp = `    const message = {
      senderId: req.uid,
      text: req.body.text || "",
      type: req.body.type || "text",
      status: "sent",
      imageUrl: req.body.imageUrl || null,
      audioUrl: req.body.audioUrl || null,
      audioDuration: req.body.audioDuration || 0,
      replyTo: req.body.replyTo || null,
      createdAt: new Date(),
    };`;
if (ch.includes(oldHttp)) {
  ch = ch.replace(oldHttp, newHttp);
  console.log("chats.js HTTP fallback patched");
} else if (ch.includes("audioUrl: req.body.audioUrl")) {
  console.log("chats.js HTTP fallback already patched");
} else {
  console.log("!! chats.js HTTP fallback pattern not found");
}

fs.writeFileSync(chatsPath, ch);

console.log("DONE");
