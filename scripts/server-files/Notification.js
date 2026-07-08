const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  toUid:    { type: String, required: true, index: true },
  type:     { type: String, enum: ["message","like","match","story_view","story_reply","profile_view","hi","admin","announcement","system"], required: true },
  fromUid:  { type: String, required: true },
  fromName: { type: String, default: "" },
  fromPhoto:{ type: String, default: "" },
  text:     { type: String, default: "" },
  title:    { type: String, default: "" },
  read:     { type: Boolean, default: false },
  storyId:  String,
  storyImageUrl: String,
}, { timestamps: true });

// 1 hafta sonra otomatik sil (tum kullanicilar icin)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 86400 });

module.exports = mongoose.model("Notification", notificationSchema);
