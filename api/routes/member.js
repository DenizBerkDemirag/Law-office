const express = require("express");
const router = express.Router();
const { isAuthenticated, isMember } = require("../middleware/auth");
const Case = require("../db/models/Case");
const Document = require("../db/models/Document");
const Appointment = require("../db/models/Appointment");

router.use(isAuthenticated, isMember);

router.get("/dashboard", async (req, res) => {
  const cases = await Case.find({ Member: req.session.userId }).sort({
    CreatedAt: -1,
  });
  const appointments = await Appointment.find({
    Member: req.session.userId,
  }).sort({ CreatedAt: -1 });
  res.render("member/dashboard", { cases, appointments });
});

// Dava detay
router.get("/cases/:id", async (req, res) => {
  const caseItem = await Case.findById(req.params.id).populate("Member");

  if (!caseItem) return res.status(404).send("Dava bulunamadı.");

  if (caseItem.Member._id.toString() !== req.session.userId.toString()) {
    return res.status(403).send("Bu davaya erişim yetkiniz yok.");
  }

  const documents = await Document.find({ Case: req.params.id });
  res.render("member/caseDetail", { caseItem, documents });
});

// Belge indirme
router.get("/documents/:id/download", async (req, res) => {
  const document = await Document.findById(req.params.id).populate("Case");
  if (!document) return res.status(404).send("Belge bulunamadı.");

  if (!document.FilePath) {
    return res
      .status(410)
      .send("Bu belgenin dosya kaydı eksik, indirilemiyor.");
  }

  if (
    !document.Case ||
    document.Case.Member.toString() !== req.session.userId.toString()
  ) {
    return res.status(403).send("Bu belgeye erişim yetkiniz yok.");
  }

  res.sendFile(document.FilePath);
});

// ============ RANDEVU İSTEME ============
router.post("/appointments", async (req, res) => {
  try {
    const { requestedDate, note } = req.body;

    if (!requestedDate) {
      const cases = await Case.find({ Member: req.session.userId }).sort({
        CreatedAt: -1,
      });
      const appointments = await Appointment.find({
        Member: req.session.userId,
      }).sort({ CreatedAt: -1 });
      return res.status(400).render("member/dashboard", {
        cases,
        appointments,
        error: "Randevu tarihi zorunludur.",
      });
    }

    const parsedDate = new Date(requestedDate);

    if (isNaN(parsedDate.getTime())) {
      const cases = await Case.find({ Member: req.session.userId }).sort({
        CreatedAt: -1,
      });
      const appointments = await Appointment.find({
        Member: req.session.userId,
      }).sort({ CreatedAt: -1 });
      return res.status(400).render("member/dashboard", {
        cases,
        appointments,
        error: "Geçersiz tarih formatı.",
      });
    }

    // Geçmiş tarih kontrolü
    if (parsedDate < new Date()) {
      const cases = await Case.find({ Member: req.session.userId }).sort({
        CreatedAt: -1,
      });
      const appointments = await Appointment.find({
        Member: req.session.userId,
      }).sort({ CreatedAt: -1 });
      return res.status(400).render("member/dashboard", {
        cases,
        appointments,
        error: "Geçmiş bir tarihe randevu alamazsınız.",
      });
    }

    // 30 dakikalık dilim kontrolü — dakika 0 veya 30 değilse reddet
    const minutes = parsedDate.getMinutes();
    if (minutes !== 0 && minutes !== 30) {
      const cases = await Case.find({ Member: req.session.userId }).sort({
        CreatedAt: -1,
      });
      const appointments = await Appointment.find({
        Member: req.session.userId,
      }).sort({ CreatedAt: -1 });
      return res.status(400).render("member/dashboard", {
        cases,
        appointments,
        error:
          "Randevular sadece saat başı veya buçuklarda alınabilir (örn. 14:00, 14:30).",
      });
    }

    // Saniye/milisaniye varsa temizle (tam dakikaya yuvarla)
    parsedDate.setSeconds(0, 0);

    await Appointment.create({
      Member: req.session.userId,
      RequestedDate: parsedDate,
      Note: note,
    });

    res.redirect("/member/dashboard");
  } catch (err) {
    console.error(err);
    const cases = await Case.find({ Member: req.session.userId }).sort({
      CreatedAt: -1,
    });
    const appointments = await Appointment.find({
      Member: req.session.userId,
    }).sort({ CreatedAt: -1 });
    res.status(500).render("member/dashboard", {
      cases,
      appointments,
      error: "Randevu talebi oluşturulurken bir hata oluştu.",
    });
  }
});

module.exports = router;
