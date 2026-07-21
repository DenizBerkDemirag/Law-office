const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    FileNumber: {
      type: String,
      required: true,
      unique: true,
    },

    Subject: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "CreatedAt",
      updatedAt: false,
    },
  },
);

class Case extends mongoose.Model {}

schema.loadClass(Case);

module.exports = mongoose.model("Case", schema);
