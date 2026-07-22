const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    Case: { type: mongoose.Schema.Types.ObjectId, ref: "Case" },
    FileName: { type: String, required: true },
    FilePath: { type: String, required: true },

    Archived: { type: Boolean, default: false },
    ArchivedAt: { type: Date },
    ArchivedCaseFileNumber: { type: String },
    ArchivedCaseSubject: { type: String },
    ArchivedMemberEmail: { type: String }, // ⬅️ yeni alan
  },
  {
    versionKey: false,
    timestamps: { createdAt: "UploadedAt", updatedAt: false },
  },
);

class Document extends mongoose.Model {}
schema.loadClass(Document);
module.exports = mongoose.model("Document", schema);
