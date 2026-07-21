const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    Case: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      required: true,
    },

    FileName: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "UploadedAt",
      updatedAt: false,
    },
  },
);

class Document extends mongoose.Model {}

schema.loadClass(Document);

module.exports = mongoose.model("Document", schema);
