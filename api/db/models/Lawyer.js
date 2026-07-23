const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Name: { type: String, required: true },
    Slug: { type: String, required: true, unique: true },
    Title: { type: String, required: true },
    Photo: { type: String, default: "/Fotograflar/resim.png" },
    Badge: { type: String },
    About: { type: String },
    Education: { type: String },
    Expertise: { type: String },
    Experience: { type: String },
    Phone: { type: String },
    Email: { type: String },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
    },
  },
);

class Lawyer extends mongoose.Model {}

schema.loadClass(Lawyer);
module.exports = mongoose.model("Lawyer", schema);
