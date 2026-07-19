const mongoose = require("mongoose");
const Subject = require("./models/Subject");

// Real GATE CS subjects with a starter set of topics.
// The user can add / delete / rename their own topics on top of these.
const SEED = [
  {
    name: "Programming & Data Structures", priority: "q",
    topics: ["Recursion", "Arrays & Strings", "Linked Lists", "Stacks & Queues", "Trees & BST", "Heaps", "Hashing", "Graphs (representation)"],
  },
  {
    name: "Databases (DBMS)", priority: "q",
    topics: ["ER Model", "Relational Algebra", "SQL", "Normalization (1NF–BCNF)", "Transactions & Concurrency", "Indexing (B / B+ Trees)", "File Organization"],
  },
  {
    name: "General Aptitude", priority: "q",
    topics: ["Quantitative Aptitude", "Verbal Ability", "Logical Reasoning", "Data Interpretation"],
  },
  {
    name: "Algorithms", priority: "m",
    topics: ["Asymptotic Analysis", "Divide & Conquer", "Greedy", "Dynamic Programming", "Graph Algorithms (BFS/DFS/MST/Shortest Path)", "Searching & Sorting", "P, NP & Complexity"],
  },
  {
    name: "Operating Systems", priority: "m",
    topics: ["Processes & Threads", "CPU Scheduling", "Synchronization", "Deadlocks", "Memory Management", "Paging & Segmentation", "Virtual Memory", "File Systems", "Disk Scheduling"],
  },
  {
    name: "Computer Networks", priority: "m",
    topics: ["OSI & TCP/IP Models", "Data Link Layer", "MAC & Ethernet", "IP Addressing & Subnetting", "Routing", "TCP / UDP", "Congestion Control", "Application Layer (DNS/HTTP)"],
  },
  {
    name: "Engineering Maths", priority: "m",
    topics: ["Linear Algebra", "Calculus", "Probability", "Statistics"],
  },
  {
    name: "Digital Logic", priority: "m",
    topics: ["Number Systems", "Boolean Algebra", "K-Maps", "Combinational Circuits", "Sequential Circuits", "Flip-Flops", "Counters & Registers"],
  },
  {
    name: "Theory of Computation", priority: "h",
    topics: ["Finite Automata (DFA/NFA)", "Regular Expressions & Languages", "Pumping Lemma", "Context-Free Grammars", "Pushdown Automata", "Turing Machines", "Decidability & Undecidability"],
  },
  {
    name: "Discrete Mathematics", priority: "h",
    topics: ["Set Theory", "Relations & Functions", "Propositional & First-Order Logic", "Groups & Lattices", "Combinatorics", "Graph Theory", "Recurrence Relations"],
  },
  {
    name: "Computer Org & Architecture", priority: "h",
    topics: ["Machine Instructions & Addressing", "ALU & Data Path", "Control Unit", "Instruction Pipelining", "Memory Hierarchy", "Cache Memory", "I/O (Interrupts / DMA)"],
  },
  {
    name: "Compiler Design", priority: "h",
    topics: ["Lexical Analysis", "Parsing (Top-down / Bottom-up)", "Syntax-Directed Translation", "Intermediate Code", "Runtime Environments", "Code Optimization"],
  },
];

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI missing. Set it in a .env file (local) or as an environment variable (Render / Atlas)."
    );
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log("✓ MongoDB connected");
  await seedIfEmpty();
}

// Only seeds when the collection is completely empty, so it never
// overwrites the user's own data on redeploys / restarts.
async function seedIfEmpty() {
  const count = await Subject.countDocuments();
  if (count > 0) return;
  const docs = SEED.map((s, i) => ({
    name: s.name,
    priority: s.priority,
    order: i,
    topics: s.topics.map((t, j) => ({ name: t, done: false, order: j })),
  }));
  await Subject.insertMany(docs);
  console.log(`✓ Seeded ${docs.length} subjects with starter topics`);
}

module.exports = { connectDB, seedIfEmpty };
