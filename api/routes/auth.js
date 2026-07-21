const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../db/models/User");

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ Email: email });

  if (!user) return res.render("login", { error: "Kullanıcı bulunamadı." });

  const match = await bcrypt.compare(password, user.Password);
  if (!match) return res.render("login", { error: "Şifre hatalı." });

  req.session.userId = user._id;
  req.session.role = user.Role;

  if (user.Role === "lawyer") return res.redirect("/lawyer/dashboard");
  return res.redirect("/member/dashboard");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
