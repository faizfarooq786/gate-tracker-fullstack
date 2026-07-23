// One-time seeder: RESETS the subjects collection and loads the full GATE syllabus.
// Usage:  npm run seed
// WARNING: this deletes all current subjects/topics and replaces them with the
// complete GATE CS syllabus from db.js. Your ticks/reorders will be reset.

require("dotenv").config();
const mongoose = require("mongoose");
const Subject = require("./models/Subject");
const { connectMongo, insertSeed, SEED } = require("./db");

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("✗ MONGODB_URI missing. Add it to your .env file.");
    process.exit(1);
  }
  try {
    await connectMongo();
    console.log("✓ MongoDB connected");

    // Report what's currently there (so nothing is lost silently).
    const existing = await Subject.find().lean();
    const curTopics = existing.reduce((n, s) => n + s.topics.length, 0);
    console.log(`\nCurrent DB: ${existing.length} subjects, ${curTopics} topics — these will be REPLACED.`);

    await Subject.deleteMany({});
    await insertSeed();

    const after = await Subject.find().lean();
    const newTopics = after.reduce((n, s) => n + s.topics.length, 0);
    console.log(`\n✓ Seeded ${after.length} subjects, ${newTopics} topics (full GATE syllabus).`);
    console.log("Subjects:", SEED.map((s) => s.name).join(", "));
  } catch (err) {
    console.error("✗ Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
