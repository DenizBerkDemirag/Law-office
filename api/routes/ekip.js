const express = require("express");
const router = express.Router();
const config = require("../config");
const Lawyer = require("../db/models/Lawyer");

/* GET /ekip/:slug — Lawyer profile page */
router.get("/:slug", async function (req, res, next) {
  const lawyer = await Lawyer.findOne({ Slug: req.params.slug });

  if (!lawyer) {
    return next(); // Falls back to 404
  }

  res.render("ekip/profile", {
    title: `${lawyer.Name} — Altınbaş Avukat Bürosu`,
    lawyer,
    config,
  });
});

module.exports = router;
