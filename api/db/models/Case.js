const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Uye: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dosyaNo: {
      type: String,
      required: true,
      unique: true,
    },
    Konu: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
    },
  },
);

class Case extends mongoose.Model {}

schema.loadClass(Case);
module.exports = mongoose.model("Case", schema);
