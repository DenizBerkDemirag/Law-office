const express = require("express");
const router = express.Router();
const { isAuthenticated, isMember } = require("../middleware/auth");
const Case = require("../db/models/Case");
const Document = require("../db/models/Document");

router.use(isAuthenticated, isMember);

router.get("/dashboard", async (req, res) => {
  const cases = await Case.find({ Uye: req.session.userId }).sort({
    created_at: -1,
  });
  res.render("member/dashboard", { cases });
});

// Dava detay — sadece kendi davasına erişebilir
router.get("/cases/:id", async (req, res) => {
  const dava = await Case.findById(req.params.id).populate("Uye");

  if (!dava) return res.status(404).send("Dava bulunamadı.");

  // Kritik güvenlik kontrolü: bu dava gerçekten bu üyeye mi ait?
  if (dava.Uye._id.toString() !== req.session.userId.toString()) {
    return res.status(403).send("Bu davaya erişim yetkiniz yok.");
  }

  const belgeler = await Document.find({ Dava: req.params.id });
  res.render("member/caseDetail", { dava, belgeler });
});

module.exports = router;
