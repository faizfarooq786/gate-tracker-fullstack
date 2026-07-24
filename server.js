require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const { connectDB } = require("./db");
const Subject = require("./models/Subject");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- helpers ----
const isId = (id) => mongoose.Types.ObjectId.isValid(id);
// Wrap async handlers so rejected promises become 500s instead of crashing.
const wrap = (fn) => (req, res) => fn(req, res).catch((err) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

// ---- API ----

// Full state: every subject with its topics, ordered.
app.get("/api/state", wrap(async (req, res) => {
  const subjects = await Subject.find().sort({ order: 1, createdAt: 1 }).lean();
  subjects.forEach((s) => s.topics.sort((a, b) => a.order - b.order));
  res.json({ subjects });
}));

// Reorder subjects. Body: { ids: [subjectId, ...] } in the desired order.
// Defined before "/api/subjects/:id/..." routes so it never gets shadowed.
app.patch("/api/subjects/reorder", wrap(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
  if (!ids || !ids.length || !ids.every(isId))
    return res.status(400).json({ error: "ids array is required" });
  await Promise.all(ids.map((id, i) => Subject.updateOne({ _id: id }, { $set: { order: i } })));
  res.json({ ok: true });
}));

// Reorder topics within a subject. Body: { ids: [topicId, ...] } in the desired order.
// Defined before the "/topics/:tid" route so "reorder" is not treated as a topic id.
app.patch("/api/subjects/:id/topics/reorder", wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
  if (!ids) return res.status(400).json({ error: "ids array is required" });
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const rank = new Map(ids.map((id, i) => [String(id), i]));
  subject.topics.forEach((t) => {
    const r = rank.get(String(t._id));
    if (r !== undefined) t.order = r;
  });
  await subject.save();
  res.json({ ok: true });
}));

// Create a subject.
app.post("/api/subjects", wrap(async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Subject name is required" });
  const priority = ["q", "m", "h"].includes(req.body?.priority) ? req.body.priority : "m";
  const last = await Subject.findOne().sort({ order: -1 }).lean();
  const subject = await Subject.create({ name, priority, order: last ? last.order + 1 : 0, topics: [] });
  res.status(201).json(subject);
}));

// Delete a subject (and its topics).
app.delete("/api/subjects/:id", wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  await Subject.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}));

// Add a topic to a subject.
app.post("/api/subjects/:id/topics", wrap(async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ error: "Invalid id" });
  const name = (req.body?.name || "").trim();
  if (!name) return res.status(400).json({ error: "Topic name is required" });
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const order = subject.topics.length
    ? Math.max(...subject.topics.map((t) => t.order)) + 1
    : 0;
  subject.topics.push({ name, done: false, order });
  await subject.save();
  res.status(201).json(subject.topics[subject.topics.length - 1]);
}));

// Update a topic (toggle done and/or rename).
app.patch("/api/subjects/:sid/topics/:tid", wrap(async (req, res) => {
  if (!isId(req.params.sid) || !isId(req.params.tid))
    return res.status(400).json({ error: "Invalid id" });
  const subject = await Subject.findById(req.params.sid);
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const topic = subject.topics.id(req.params.tid);
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  if (typeof req.body?.done === "boolean") topic.done = req.body.done;
  if (typeof req.body?.name === "string" && req.body.name.trim()) topic.name = req.body.name.trim();
  await subject.save();
  res.json(topic);
}));

// Delete a topic.
app.delete("/api/subjects/:sid/topics/:tid", wrap(async (req, res) => {
  if (!isId(req.params.sid) || !isId(req.params.tid))
    return res.status(400).json({ error: "Invalid id" });
  const subject = await Subject.findById(req.params.sid);
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  const topic = subject.topics.id(req.params.tid);
  if (!topic) return res.status(404).json({ error: "Topic not found" });
  topic.deleteOne();
  await subject.save();
  res.json({ ok: true });
}));

// Health check (handy for Render).
app.get("/api/health", (req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 }));

// ---- boot ----
const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`✓ Placement tracker running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("✗ Startup failed:", err.message);
    process.exit(1);
  });
