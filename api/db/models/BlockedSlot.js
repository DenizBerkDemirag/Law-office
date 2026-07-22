const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Date: { type: String, required: true }, // "YYYY-MM-DD" formatında
    Time: { type: String, required: true }, // "HH:MM" formatında
  },
  {
    versionKey: false,
    timestamps: { createdAt: "CreatedAt", updatedAt: false },
  },
);

// Aynı gün+saat kombinasyonu iki kere kapatılamasın
schema.index({ Date: 1, Time: 1 }, { unique: true });

class BlockedSlot extends mongoose.Model {}
schema.loadClass(BlockedSlot);
module.exports = mongoose.model("BlockedSlot", schema);
