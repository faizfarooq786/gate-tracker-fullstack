const mongoose = require("mongoose");
const Subject = require("./models/Subject");

// Placement preparation syllabus — every area with all topics.
// priority: q = quick / your strength, m = moderate, h = heavy (most focus).
const SEED = [
  {
    name: "DSA — Foundations", priority: "m",
    topics: [
      "Time & Space Complexity (Big-O)", "Arrays", "Strings", "Hashing (HashMap/HashSet)",
      "Two Pointers", "Sliding Window", "Prefix Sum", "Binary Search",
      "Sorting Algorithms", "Recursion & Backtracking", "Bit Manipulation", "Math & Number Theory",
    ],
  },
  {
    name: "DSA — Core", priority: "h",
    topics: [
      "Linked Lists (singly/doubly)", "Stacks & Queues", "Monotonic Stack/Queue",
      "Binary Trees & Traversals", "Binary Search Trees (BST)", "Heaps / Priority Queue",
      "Greedy Algorithms", "Intervals", "Matrix / 2D Arrays",
    ],
  },
  {
    name: "DSA — Advanced", priority: "h",
    topics: [
      "Graphs — BFS/DFS", "Graphs — Topological Sort",
      "Graphs — Shortest Path (Dijkstra, Bellman-Ford)", "Graphs — MST (Prim/Kruskal)",
      "Union-Find (DSU)", "DP — 1D", "DP — 2D / Grid",
      "DP — Subsequences / Knapsack", "Tries", "Segment Tree / Fenwick (optional)",
    ],
  },
  {
    name: "CS Fundamentals", priority: "m",
    topics: [
      "OOP Concepts (encapsulation, inheritance, polymorphism, abstraction)",
      "DBMS & SQL (normalization, joins, transactions, indexing)",
      "Operating Systems (processes, threads, scheduling, deadlock, memory)",
      "Computer Networks (OSI/TCP-IP, HTTP, TCP/UDP, DNS)",
    ],
  },
  {
    name: "Low-Level Design (LLD)", priority: "m",
    topics: [
      "OOP Design & UML basics", "SOLID Principles",
      "Design Patterns (Singleton, Factory, Observer, Strategy…)",
      "LLD Problems (Parking Lot, BookMyShow, Splitwise…)",
    ],
  },
  {
    name: "System Design (HLD)", priority: "h",
    topics: [
      "Scalability & Load Balancing", "Caching (Redis, CDN)",
      "Databases — SQL vs NoSQL, Indexing", "Sharding & Replication",
      "CAP Theorem & Consistency", "Message Queues (Kafka/RabbitMQ)",
      "API Design & Rate Limiting", "Case Studies (URL Shortener, Twitter feed…)",
    ],
  },
  {
    name: "Development (stay sharp)", priority: "q",
    topics: [
      "JavaScript / TypeScript (deep)", "Angular / React", "Node.js / Express / Laravel",
      "REST API Design", "Databases (MySQL / MongoDB)", "Git & GitHub",
      "Docker / CI-CD", "Project Deep-Dive Prep (explain decisions & trade-offs)",
    ],
  },
  {
    name: "Aptitude & Reasoning", priority: "q",
    topics: [
      "Quantitative Aptitude", "Logical Reasoning", "Verbal Ability",
      "Data Interpretation", "Pseudocode / MCQ (Capgemini/Accenture style)",
    ],
  },
  {
    name: "Profile & Applying", priority: "q",
    topics: [
      "Resume (ATS-friendly)", "LinkedIn Optimization", "GitHub Cleanup",
      "LeetCode / Coding Profile", "Portfolio Website", "Referrals Outreach",
      "Job Portals (LinkedIn, Naukri, Instahyre, Wellfound, Cutshort)",
      "Mock Interviews", "Behavioral / HR Prep", "Application Tracking",
    ],
  },
];

// Connects to MongoDB. Some networks refuse MongoDB's SRV DNS lookup
// (querySrv ECONNREFUSED); if that happens we retry via public DNS resolvers.
async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI missing. Set it in a .env file (local) or as an environment variable (Render / Atlas)."
    );
  }
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  } catch (err) {
    if (/querySrv|ENOTFOUND|ECONNREFUSED|ETIMEOUT|ESERVFAIL|EAI_AGAIN/i.test(err.message || "")) {
      console.warn("DNS SRV lookup failed — retrying via public DNS (8.8.8.8 / 1.1.1.1)…");
      require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    } else {
      throw err;
    }
  }
}

async function connectDB() {
  await connectMongo();
  console.log("✓ MongoDB connected");
  await seedIfEmpty();
}

// Only seeds when the collection is completely empty, so it never
// overwrites your data on redeploys / restarts.
async function seedIfEmpty() {
  const count = await Subject.countDocuments();
  if (count > 0) return;
  await insertSeed();
  console.log(`✓ Seeded ${SEED.length} placement-prep areas with all topics`);
}

// Inserts the SEED list as fresh documents (with ordering).
async function insertSeed() {
  const docs = SEED.map((s, i) => ({
    name: s.name,
    priority: s.priority,
    order: i,
    topics: s.topics.map((t, j) => ({ name: t, done: false, order: j })),
  }));
  await Subject.insertMany(docs);
}

module.exports = { connectDB, connectMongo, seedIfEmpty, insertSeed, SEED };
