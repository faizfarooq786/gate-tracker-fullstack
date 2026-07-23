const mongoose = require("mongoose");
const Subject = require("./models/Subject");

// Complete GATE CS syllabus — every subject with all topics GATE asks.
// priority: q = quick win, m = moderate, h = heavy (start early).
const SEED = [
  {
    name: "Discrete Mathematics", priority: "h",
    topics: [
      "Propositional Logic", "First-Order (Predicate) Logic", "Sets",
      "Relations (properties, closures, equivalence)", "Functions (injective/surjective/bijective)",
      "Partial Orders & Lattices", "Groups & Monoids",
      "Combinatorics (counting, pigeonhole, inclusion-exclusion)",
      "Recurrence Relations & Generating Functions", "Graph Theory",
    ],
  },
  {
    name: "Linear Algebra", priority: "m",
    topics: [
      "Matrices & Determinants", "Rank of a Matrix", "System of Linear Equations",
      "Eigenvalues & Eigenvectors", "LU Decomposition",
    ],
  },
  {
    name: "Calculus", priority: "m",
    topics: [
      "Limits, Continuity & Differentiability", "Maxima & Minima",
      "Mean Value Theorem", "Integration",
    ],
  },
  {
    name: "Probability & Statistics", priority: "m",
    topics: [
      "Basic & Conditional Probability, Bayes' Theorem", "Random Variables",
      "Distributions (uniform, normal, exponential, Poisson, binomial)",
      "Mean, Median, Mode, Variance & Std Dev",
    ],
  },
  {
    name: "Digital Logic", priority: "m",
    topics: [
      "Number Systems & Complements", "Codes (BCD, Gray, excess-3)",
      "Boolean Algebra & Functions (SOP/POS)", "Minimization (K-maps, Quine-McCluskey)",
      "Combinational Circuits (adders, MUX, decoders)", "Sequential Circuits & Flip-Flops",
      "Registers & Counters", "Finite State Machines (Mealy/Moore)",
      "Number Representation & Computer Arithmetic (fixed/floating point, IEEE 754)",
    ],
  },
  {
    name: "Computer Org & Architecture", priority: "h",
    topics: [
      "Machine Instructions & Addressing Modes", "Instruction Formats & Cycle",
      "ALU & Data Path", "Control Unit (hardwired/microprogrammed)",
      "Instruction Pipelining & Hazards", "Memory Hierarchy",
      "Cache Memory (mapping, replacement, write policies)", "Main & Secondary Memory",
      "I/O (Interrupts, DMA)", "Computer Arithmetic (Booth's, division)",
    ],
  },
  {
    name: "Programming & Data Structures", priority: "q",
    topics: [
      "C Programming (types, control flow, functions, storage classes)", "Pointers",
      "Structures, Unions & Dynamic Memory", "Recursion", "Arrays (addressing)",
      "Stacks (expression evaluation)", "Queues (circular, deque, priority)",
      "Linked Lists (singly/doubly/circular)", "Trees (binary, BST, traversals)",
      "AVL Trees", "Heaps", "Hashing", "Graphs (representation)",
    ],
  },
  {
    name: "Algorithms", priority: "m",
    topics: [
      "Asymptotic Notation & Complexity", "Recurrences (Master Theorem)",
      "Divide & Conquer", "Greedy Algorithms", "Dynamic Programming",
      "Searching & Sorting", "Graph Traversals (BFS/DFS)",
      "Minimum Spanning Trees (Prim/Kruskal)",
      "Shortest Paths (Dijkstra, Bellman-Ford, Floyd-Warshall)", "P, NP, NP-Complete (basics)",
    ],
  },
  {
    name: "Theory of Computation", priority: "h",
    topics: [
      "Finite Automata (DFA, NFA, ε-NFA)", "DFA Minimization",
      "Regular Expressions & Languages", "Pumping Lemma (Regular)",
      "Closure Properties (Regular)", "Context-Free Grammars (ambiguity, normal forms)",
      "Pushdown Automata", "Pumping Lemma (CFL)", "Turing Machines",
      "Decidability & Undecidability", "Chomsky Hierarchy",
    ],
  },
  {
    name: "Compiler Design", priority: "h",
    topics: [
      "Compiler Phases", "Lexical Analysis",
      "Parsing - Top-Down (LL(1), FIRST & FOLLOW)",
      "Parsing - Bottom-Up (LR, SLR, LALR, CLR)", "Syntax-Directed Translation",
      "Intermediate Code Generation", "Symbol Table", "Runtime Environments",
      "Code Optimization & Data-Flow Analysis",
    ],
  },
  {
    name: "Operating Systems", priority: "m",
    topics: [
      "Processes & Threads", "Inter-Process Communication", "CPU Scheduling",
      "Process Synchronization (semaphores, monitors, classic problems)",
      "Deadlocks (Banker's algorithm)", "Memory Management (paging, segmentation)",
      "Virtual Memory (page replacement, thrashing)", "File Systems", "Disk Scheduling",
    ],
  },
  {
    name: "Databases (DBMS)", priority: "q",
    topics: [
      "ER Model", "Relational Algebra & Calculus", "SQL", "Integrity Constraints",
      "Functional Dependencies", "Normalization (1NF-BCNF, 4NF)",
      "File Organization & Indexing (B/B+ Trees)", "Transactions & Serializability",
      "Concurrency Control (2PL, timestamp ordering)",
    ],
  },
  {
    name: "Computer Networks", priority: "m",
    topics: [
      "OSI & TCP/IP Models", "Switching (packet/circuit/virtual)",
      "Data Link Layer (framing, error/flow control)", "Sliding Window (GBN, Selective Repeat)",
      "Medium Access Control (Ethernet, CSMA)", "IP Addressing & Subnetting (CIDR)",
      "Routing (distance-vector, link-state)", "IP Support Protocols (ARP, DHCP, ICMP, NAT)",
      "Transport Layer (TCP, UDP, congestion control)",
      "Application Layer (DNS, HTTP, SMTP, FTP)", "Network Security Basics",
    ],
  },
  {
    name: "General Aptitude", priority: "q",
    topics: [
      "Verbal Aptitude (grammar, vocabulary, comprehension)", "Quantitative Aptitude",
      "Data Interpretation", "Analytical / Logical Reasoning", "Spatial Aptitude",
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
// overwrites the user's own data on redeploys / restarts.
async function seedIfEmpty() {
  const count = await Subject.countDocuments();
  if (count > 0) return;
  await insertSeed();
  console.log(`✓ Seeded ${SEED.length} subjects with the full GATE syllabus`);
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
