const express = require("express");
const router = express.Router();
const { isAuthenticated, isMember } = require("../middleware/auth");
const Case = require("../models/Case");

router.use(isAuthenticated, isMember);

router.get("/dashboard", async (req, res) => {
  const cases = await Case.find({ Uye: req.session.userId });
  res.render("member/dashboard", { cases });
});

module.exports = router;
