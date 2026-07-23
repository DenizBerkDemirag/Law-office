const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Content: {
      type: String,
      required: true,
      trim: true,
    },
    IsRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "CreatedAt",
      updatedAt: false,
    },
  }
);

class Message extends mongoose.Model {}

schema.loadClass(Message);

module.exports = mongoose.model("Message", schema);
