const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { isAuthenticated, isLawyer } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Case = require("../models/Case");
const Document = require("../models/Document");
const User = require("../models/User");

router.use(isAuthenticated, isLawyer);

// Büro paneli - tüm davalar
router.get("/dashboard", async (req, res) => {
  const cases = await Case.find().populate("Uye").sort({ created_at: -1 });
  res.render("lawyer/dashboard", { cases });
});

// Müvekkil kaydı
router.post("/clients", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).render("lawyer/dashboard", {
        cases: await Case.find().populate("Uye"),
        error: "Email, şifre ve kullanıcı adı zorunludur.",
      });
    }

    const existingEmail = await User.findOne({ Email: email });
    if (existingEmail) {
      return res.status(400).render("lawyer/dashboard", {
        cases: await Case.find().populate("Uye"),
        error: "Bu email ile kayıtlı bir kullanıcı zaten var.",
      });
    }

    const existingUsername = await User.findOne({ Username: username });
    if (existingUsername) {
      return res.status(400).render("lawyer/dashboard", {
        cases: await Case.find().populate("Uye"),
        error: "Bu kullanıcı adı zaten alınmış.",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({
      Email: email,
      Password: hash,
      Username: username,
      Role: "member",
    });

    res.redirect("/lawyer/dashboard");
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).render("lawyer/dashboard", {
        cases: await Case.find().populate("Uye"),
        error: "Bu email veya kullanıcı adı zaten kayıtlı.",
      });
    }
    res.status(500).send("Müvekkil kaydedilirken bir hata oluştu.");
  }
});

// Dava ekleme
router.post("/cases", async (req, res) => {
  try {
    const { uyeId, dosyaNo, konu } = req.body;

    if (!uyeId || !dosyaNo || !konu) {
      return res.status(400).render("lawyer/dashboard", {
        cases: await Case.find().populate("Uye"),
        error: "Müvekkil, dosya no ve konu zorunludur.",
      });
    }

    // Belirtilen kullanıcının gerçekten bir üye olduğunu doğrula
    const uye = await User.findById(uyeId);
    if (!uye || uye.Role !== "member") {
      return res.status(400).render("lawyer/dashboard", {
        cases: await Case.find().populate("Uye"),
        error: "Geçersiz müvekkil seçimi.",
      });
    }

    await Case.create({
      Uye: uyeId,
      dosyaNo,
      Konu: konu,
    });

    res.redirect("/lawyer/dashboard");
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      // MongoDB unique constraint hatası (dosyaNo zaten var)
      return res.status(400).render("lawyer/dashboard", {
        cases: await Case.find().populate("Uye"),
        error: "Bu dosya numarası zaten kayıtlı.",
      });
    }
    res.status(500).send("Dava eklenirken bir hata oluştu.");
  }
});

// Dava detay
router.get("/cases/:id", async (req, res) => {
  const dava = await Case.findById(req.params.id).populate("Uye");
  if (!dava) return res.status(404).send("Dava bulunamadı.");

  const belgeler = await Document.find({ Dava: req.params.id });
  res.render("lawyer/caseDetail", { dava, belgeler });
});

// Belge yükleme
router.post(
  "/cases/:id/documents",
  (req, res, next) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        const dava = await Case.findById(req.params.id).populate("Uye");
        const belgeler = await Document.find({ Dava: req.params.id });
        return res.status(400).render("lawyer/caseDetail", {
          dava,
          belgeler,
          error: err.message,
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const caseId = req.params.id;
      const dava = await Case.findById(caseId);
      if (!dava) return res.status(404).send("Dava bulunamadı.");

      if (!req.file) {
        const belgeler = await Document.find({ Dava: caseId });
        return res.status(400).render("lawyer/caseDetail", {
          dava,
          belgeler,
          error: "Lütfen bir dosya seçin.",
        });
      }

      await Document.create({
        Dava: caseId,
        Uye: req.session.userId,
        FileName: req.file.originalname,
        FilePath: req.file.path,
      });

      res.redirect(`/lawyer/cases/${caseId}`);
    } catch (err) {
      console.error(err);
      res.status(500).send("Belge kaydedilirken bir hata oluştu.");
    }
  },
);

module.exports = router;
