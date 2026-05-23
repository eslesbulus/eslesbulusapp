const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  userName:  { type: String, default: "" },
  userPhoto: { type: String, default: "" },
  text:      { type: String, required: true },
  replyTo:   { type: mongoose.Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  text:          { type: String, default: "" },
  imageUrl:      { type: String, default: null },
  archived:      { type: Boolean, default: false },
  likesCount:    { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  likedBy:       [{ type: String }],
  comments:      [commentSchema],
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
