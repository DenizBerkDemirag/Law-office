const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    RequestedDate: {
      type: Date,
      required: true,
    },
    Note: {
      type: String,
      trim: true,
    },
    Status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "CreatedAt", updatedAt: false },
  },
);

class Appointment extends mongoose.Model {}
schema.loadClass(Appointment);
module.exports = mongoose.model("Appointment", schema);
