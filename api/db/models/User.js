const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    Email: { type: String, required: true, unique: true },
    Password: { type: String, required: true },
    Username: {
      type: String,
      required: function () {
        return this.Role === "member";
      },
      unique: true,
      sparse: true, // so null/undefined won't collide if lawyers do not enter Username
    },
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
