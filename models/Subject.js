const mongoose = require("mongoose");

const { Schema } = mongoose;

// A single study topic that lives inside a subject.
const topicSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    done: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// A GATE subject holds a list of topics the user creates and ticks off.
const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    // priority: q = quick win, m = moderate, h = heavy
    priority: { type: String, enum: ["q", "m", "h"], default: "m" },
    order: { type: Number, default: 0 },
    topics: [topicSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subject", subjectSchema);
