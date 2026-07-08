const m = require("mongoose");
const OLD = "http://178.251.238.228";
const NEW = "https://api.eslesbulus.com";

// Bir string alani guvenli sekilde degistir (string degilse oldugu gibi birak)
function rep(expr) {
  return {
    $cond: [
      { $eq: [{ $type: expr }, "string"] },
      { $replaceAll: { input: expr, find: OLD, replacement: NEW } },
      expr,
    ],
  };
}
// String dizisi
function repArr(field) {
  return {
    $cond: [
      { $eq: [{ $type: "$" + field }, "array"] },
      { $map: { input: "$" + field, as: "p", in: rep("$$p") } },
      "$" + field,
    ],
  };
}

(async () => {
  await m.connect("mongodb://localhost:27017/eslesbulus");
  const db = m.connection.db;

  const r1 = await db.collection("users").updateMany({}, [
    { $set: { photoURL: rep("$photoURL"), photos: repArr("photos") } },
  ]);
  console.log("users modified:", r1.modifiedCount);

  const r2 = await db.collection("posts").updateMany({}, [
    {
      $set: {
        imageUrl: rep("$imageUrl"),
        comments: {
          $cond: [
            { $eq: [{ $type: "$comments" }, "array"] },
            { $map: { input: "$comments", as: "c", in: { $mergeObjects: ["$$c", { userPhoto: rep("$$c.userPhoto") }] } } },
            "$comments",
          ],
        },
      },
    },
  ]);
  console.log("posts modified:", r2.modifiedCount);

  const r3 = await db.collection("stories").updateMany({}, [
    { $set: { imageUrl: rep("$imageUrl") } },
  ]);
  console.log("stories modified:", r3.modifiedCount);

  const r4 = await db.collection("chats").updateMany({}, [
    {
      $set: {
        messages: {
          $cond: [
            { $eq: [{ $type: "$messages" }, "array"] },
            {
              $map: {
                input: "$messages",
                as: "msg",
                in: { $mergeObjects: ["$$msg", { imageUrl: rep("$$msg.imageUrl"), audioUrl: rep("$$msg.audioUrl") }] },
              },
            },
            "$messages",
          ],
        },
      },
    },
  ]);
  console.log("chats modified:", r4.modifiedCount);

  const r5 = await db.collection("notifications").updateMany({}, [
    { $set: { fromPhoto: rep("$fromPhoto"), storyImageUrl: rep("$storyImageUrl") } },
  ]);
  console.log("notifications modified:", r5.modifiedCount);

  // Dogrulama — kalan eski URL var mi?
  const leftUsers = await db.collection("users").countDocuments({ $or: [{ photoURL: { $regex: "178\\.251\\.238\\.228" } }, { photos: { $regex: "178\\.251\\.238\\.228" } }] });
  console.log("users still with old URL:", leftUsers);

  await m.disconnect();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
