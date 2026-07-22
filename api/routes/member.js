const express = require("express");
const router = express.Router();
const { isAuthenticated, isMember } = require("../middleware/auth");
const Case = require("../db/models/Case");
const Document = require("../db/models/Document");
const Appointment = require("../db/models/Appointment");
const BlockedSlot = require("../db/models/BlockedSlot");
const { getAllTimeSlots } = require("../utils/timeSlots");

router.use(isAuthenticated, isMember);

router.get("/dashboard", async (req, res) => {
  const cases = await Case.find({ Member: req.session.userId }).sort({
    CreatedAt: -1,
  });
  const appointments = await Appointment.find({
    Member: req.session.userId,
  }).sort({ CreatedAt: -1 });

  // Önümüzdeki 14 gün için tarih listesi (bugün dahil)
  const upcomingDates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    upcomingDates.push({
      value: iso,
      label: d.toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    });
  }

  res.render("member/dashboard", { cases, appointments, upcomingDates });
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
    const { date, time, note } = req.body;

    async function rerender(error) {
      const cases = await Case.find({ Member: req.session.userId }).sort({
        CreatedAt: -1,
      });
      const appointments = await Appointment.find({
        Member: req.session.userId,
      }).sort({ CreatedAt: -1 });
      const upcomingDates = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        upcomingDates.push({
          value: d.toISOString().slice(0, 10),
          label: d.toLocaleDateString("tr-TR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
        });
      }
      return res
        .status(400)
        .render("member/dashboard", {
          cases,
          appointments,
          upcomingDates,
          error,
        });
    }

    if (!date || !time) {
      return await rerender("Tarih ve saat seçilmesi zorunludur.");
    }

    // Sunucu tarafında da müsaitlik kontrolü — asıl güvenlik burada
    const blocked = await BlockedSlot.findOne({ Date: date, Time: time });
    if (blocked) {
      return await rerender(
        "Seçtiğiniz saat dolu, lütfen başka bir saat seçin.",
      );
    }

    const [hour, minute] = time.split(":").map(Number);
    const requestedDate = new Date(`${date}T00:00:00`);
    requestedDate.setHours(hour, minute, 0, 0);

    if (requestedDate < new Date()) {
      return await rerender("Geçmiş bir tarihe randevu alamazsınız.");
    }

    await Appointment.create({
      Member: req.session.userId,
      RequestedDate: requestedDate,
      Note: note,
    });

    res.redirect("/member/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Randevu talebi oluşturulurken bir hata oluştu.");
  }
});

// ============ SEÇİLEN GÜN İÇİN MÜSAİT SAATLER (AJAX) ============
router.get("/available-times", async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Tarih belirtilmedi." });
  }

  const allSlots = getAllTimeSlots();

  const blocked = await BlockedSlot.find({ Date: date });
  const blockedTimes = new Set(blocked.map((b) => b.Time));

  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);

  const availableSlots = allSlots.filter((time) => {
    if (blockedTimes.has(time)) return false;

    if (isToday) {
      const [hour, minute] = time.split(":").map(Number);
      const slotTime = new Date();
      slotTime.setHours(hour, minute, 0, 0);
      if (slotTime <= now) return false; // bugünse, geçmiş saatleri filtrele
    }

    return true;
  });

  res.json({ times: availableSlots });
});

module.exports = router;
