const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Username: { type: String, required: true },
    Email: { type: String, required: true },
    Password: { type: String, required: true },
    Role: {
      type: String,
      enum: ["member", "lawyer"],
      required: true,
      default: "member",
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: "created_at",
    },
  },
);

class User extends mongoose.Model {}

schema.loadClass(User);
module.exports = mongoose.model("User", schema);
