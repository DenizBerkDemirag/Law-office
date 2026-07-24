const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Date: { type: String, required: true }, // in "YYYY-MM-DD" format
    Time: { type: String, required: true }, // in "HH:MM" format
  },
  {
    versionKey: false,
    timestamps: { createdAt: "CreatedAt", updatedAt: false },
  },
);

// Prevent closing the same date+time combination twice
schema.index({ Date: 1, Time: 1 }, { unique: true });

class BlockedSlot extends mongoose.Model {}
schema.loadClass(BlockedSlot);
module.exports = mongoose.model("BlockedSlot", schema);
