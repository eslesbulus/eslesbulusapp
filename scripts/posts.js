const router = require("express").Router();
const { authRequired } = require("../middleware/auth");
const Post = require("../models/Post");

// GET /api/posts
router.get("/", authRequired, async (req, res) => {
  const posts = await Post.find({ archived: false })
    .sort({ createdAt: -1 }).limit(100).lean();
  posts.forEach(p => {
    if (p.commentsCount === undefined || p.commentsCount === null) {
      p.commentsCount = (p.comments || []).length;
    }
  });
  res.json(posts);
});

// GET /api/posts/user/:uid
router.get("/user/:uid", authRequired, async (req, res) => {
  const filter = { userId: req.params.uid };
  if (req.params.uid !== req.uid) filter.archived = false;
  const posts = await Post.find(filter).sort({ createdAt: -1 }).lean();
  posts.forEach(p => {
    if (p.commentsCount === undefined || p.commentsCount === null) {
      p.commentsCount = (p.comments || []).length;
    }
  });
  res.json(posts);
});

// POST /api/posts
router.post("/", authRequired, async (req, res) => {
  const post = await Post.create({
    userId: req.uid,
    text: req.body.text || "",
    imageUrl: req.body.imageUrl || null,
  });
  res.status(201).json(post);
});

// GET /api/posts/:id
router.get("/:id", authRequired, async (req, res) => {
  const post = await Post.findById(req.params.id).lean();
  if (!post) return res.status(404).json({ error: "Post bulunamadi" });
  if (post.commentsCount === undefined) {
    post.commentsCount = (post.comments || []).length;
  }
  res.json(post);
});

// PUT /api/posts/:id
router.put("/:id", authRequired, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.userId !== req.uid) return res.status(403).json({ error: "Yetki yok" });
  if (req.body.text !== undefined) post.text = req.body.text;
  if (req.body.archived !== undefined) post.archived = req.body.archived;
  await post.save();
  res.json(post);
});

// DELETE /api/posts/:id
router.delete("/:id", authRequired, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.userId !== req.uid) return res.status(403).json({ error: "Yetki yok" });
  await post.deleteOne();
  res.json({ ok: true });
});

// POST /api/posts/:id/like
router.post("/:id/like", authRequired, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post bulunamadi" });
  const idx = post.likedBy.indexOf(req.uid);
  if (idx >= 0) {
    post.likedBy.splice(idx, 1);
    post.likesCount = Math.max(0, post.likesCount - 1);
  } else {
    post.likedBy.push(req.uid);
    post.likesCount += 1;
  }
  await post.save();
  res.json({ liked: idx < 0, likesCount: post.likesCount });
});

// POST /api/posts/:id/comment
router.post("/:id/comment", authRequired, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: "Post bulunamadi" });
  const comment = {
    userId: req.uid,
    userName: req.user.name,
    userPhoto: req.user.photoURL,
    text: req.body.text,
    replyTo: req.body.replyTo || null,
  };
  post.comments.push(comment);
  post.commentsCount = post.comments.length;
  await post.save();
  res.json(post.comments[post.comments.length - 1]);
});

module.exports = router;
