const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid:            { type: String, required: true, unique: true, index: true },
  email:          { type: String, default: "" },
  name:           { type: String, default: "" },
  photoURL:       { type: String, default: "" },
  birthDate:      { type: String, default: "" },
  age:            { type: Number, default: null },
  gender:         { type: String, enum: ["Erkek", "Kadın", "Diğer", ""], default: "" },
  bio:            { type: String, default: "" },
  city:           { type: String, default: "" },
  photos:         { type: [String], default: [] },
  interests:      { type: [String], default: [] },
  job:            { type: String, default: "" },
  height:         { type: Number, default: null },
  online:         { type: Boolean, default: false },
  lastActive:     { type: Date, default: Date.now },
  verified:       { type: Boolean, default: false },
  vip:            { type: Boolean, default: false },
  profileComplete:{ type: Boolean, default: false },

  // Role: user (gercek), fake-bot (AI yanit), fake-manual (insan kontrol)
  role:           { type: String, enum: ["user", "fake-bot", "fake-manual"], default: "user" },

  // Premium
  isPremium:      { type: Boolean, default: false },
  premiumExpiry:  { type: Date, default: null },

  // Coins
  tokens:         { type: Number, default: 100 },

  // Daily limits
  dailyLikesUsed:      { type: Number, default: 0 },
  dailyHisUsed:        { type: Number, default: 0 },
  dailyStoryLikesUsed: { type: Number, default: 0 },
  dailyResetDate:      { type: String, default: "" },

  // Blocked users
  viewedBy: [{ uid: String, at: { type: Date, default: Date.now } }],
  blockedUsers:   [{ uid: String, name: String, photo: String, at: Date }],

  // Liked users
  likedUsers:     [{ uid: String, at: Date }],

  // Push notification tokens
  pushTokens: [{ token: String, platform: String, updatedAt: { type: Date, default: Date.now } }],

  // Sent His
  sentHis:        [{
    userId: String,
    messageId: String,
    text: String,
    emoji: String,
    at: Date,
  }],

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
