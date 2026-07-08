const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  emoji:  { type: String, required: true },
  userId: { type: String, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  senderId:  { type: String, required: true },
  text:      { type: String, default: "" },
  type:      { type: String, enum: ["text", "gift", "image", "video", "sharedPost", "storyReply"], default: "text" },
  status:    { type: String, enum: ["sent", "delivered", "read"], default: "sent" },
  deleted:   { type: Boolean, default: false },
  reactions: { type: [reactionSchema], default: [] },
  imageUrl:  { type: String, default: null },
  replyTo:   { type: mongoose.Schema.Types.Mixed, default: null },
  gift:      { type: mongoose.Schema.Types.Mixed, default: null },
  storyReply: { storyId: String, storyImageUrl: String, storyOwnerId: String, isEmoji: Boolean },
  sharedPost:{ type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  participants: { type: [String], required: true, index: true },
  chatKey:      { type: String, unique: true, index: true },
  lastMessage:  { type: String, default: "" },
  lastMessageAt:{ type: Date, default: null },
  lastSenderId: { type: String, default: "" },
  unreadCounts: { type: Map, of: Number, default: new Map() },
  archived:     { type: [String], default: [] },
  messages:     [messageSchema],
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);
